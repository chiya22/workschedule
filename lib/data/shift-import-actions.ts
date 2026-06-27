"use server";

import { fromZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { getCurrentStaff } from "@/lib/data/auth";
import { staffRoleToShiftRole } from "@/lib/shift/roles";
import {
  parseYyyymmdd,
  validateShiftCsvRow,
  type ShiftCsvInputRow,
} from "@/lib/shift/csv-import";
import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";
import { createClient } from "@/lib/supabase/server";
import { err, ok, type Result } from "@/types/result";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

export type ShiftImportRowError = {
  line: number;
  message: string;
};

export type ShiftImportSummary = {
  created: number;
  updated: number;
  failed: ShiftImportRowError[];
};

async function requireAdmin(): Promise<Result<void, string>> {
  const me = await getCurrentStaff();
  if (!me) return err("ログインが必要です");
  if (me.role !== "admin") return err("管理者のみ実行できます");
  return ok(undefined);
}

type StaffLookup = {
  name: string;
  role: ReturnType<typeof staffRoleToShiftRole>;
};

async function loadStaffByLoginId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, StaffLookup>> {
  const { data } = await supabase.from("staff").select("login_id, name, role");
  const map = new Map<string, StaffLookup>();
  for (const row of data ?? []) {
    map.set(row.login_id.toLowerCase(), {
      name: row.name,
      role: staffRoleToShiftRole(row.role),
    });
  }
  return map;
}

function dayBoundsIso(workDateYmd: string): { start: string; end: string } {
  const dayStart = fromZonedTime(`${workDateYmd}T00:00:00`, TZ);
  const dayEnd = fromZonedTime(`${workDateYmd}T24:00:00`, TZ);
  return { start: dayStart.toISOString(), end: dayEnd.toISOString() };
}

export async function importShiftsFromCsv(
  rows: ShiftCsvInputRow[],
): Promise<Result<ShiftImportSummary, string>> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  if (rows.length === 0) {
    return err("取り込む行がありません");
  }

  const supabase = await createClient();
  const me = await getCurrentStaff();
  const staffByLoginId = await loadStaffByLoginId(supabase);

  const summary: ShiftImportSummary = {
    created: 0,
    updated: 0,
    failed: [],
  };

  for (const row of rows) {
    const parsed = validateShiftCsvRow(row);
    if (!parsed.success) {
      summary.failed.push({ line: row.line, message: parsed.error });
      continue;
    }

    const staff = staffByLoginId.get(parsed.data.loginId);
    if (!staff) {
      summary.failed.push({
        line: row.line,
        message: `id「${parsed.data.loginId}」のスタッフが見つかりません`,
      });
      continue;
    }

    const ymd = parseYyyymmdd(parsed.data.workDate);
    if (!ymd.success) {
      summary.failed.push({ line: row.line, message: ymd.error });
      continue;
    }

    const bounds = dayBoundsIso(ymd.data);
    const { data: existing, error: fetchError } = await supabase
      .from("shifts")
      .select("id")
      .eq("staff_name", staff.name)
      .gte("start_at", bounds.start)
      .lt("start_at", bounds.end)
      .order("start_at", { ascending: true });

    if (fetchError) {
      console.error("importShiftsFromCsv fetch failed:", fetchError);
      summary.failed.push({
        line: row.line,
        message: "既存勤務の確認に失敗しました",
      });
      continue;
    }

    const payload = {
      staff_name: staff.name,
      role: staff.role,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
    };

    if (existing && existing.length > 0) {
      const [primary, ...duplicates] = existing;
      const { error: updateError } = await supabase
        .from("shifts")
        .update(payload)
        .eq("id", primary!.id);

      if (updateError) {
        console.error("importShiftsFromCsv update failed:", updateError);
        summary.failed.push({
          line: row.line,
          message: "勤務情報の更新に失敗しました",
        });
        continue;
      }

      if (duplicates.length > 0) {
        const { error: deleteError } = await supabase
          .from("shifts")
          .delete()
          .in(
            "id",
            duplicates.map((d) => d.id),
          );
        if (deleteError) {
          console.error("importShiftsFromCsv duplicate delete failed:", deleteError);
        }
      }

      summary.updated += 1;
    } else {
      const { error: insertError } = await supabase.from("shifts").insert({
        ...payload,
        created_by: me?.id ?? null,
      });

      if (insertError) {
        console.error("importShiftsFromCsv insert failed:", insertError);
        summary.failed.push({
          line: row.line,
          message: "勤務情報の作成に失敗しました",
        });
        continue;
      }

      summary.created += 1;
    }
  }

  revalidatePath("/calendar");
  return ok(summary);
}
