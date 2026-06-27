"use server";

import { revalidatePath } from "next/cache";

import { getCurrentStaff } from "@/lib/data/auth";
import {
  shiftInputSchema,
  shiftPartialSchema,
  type ShiftInput,
} from "@/lib/data/shift-shared";
import { staffRoleToShiftRole } from "@/lib/shift/roles";
import { createClient } from "@/lib/supabase/server";
import { err, ok, type Result } from "@/types/result";
import type { Shift, ShiftRole } from "@/types";

export type { ShiftInput } from "@/lib/data/shift-shared";

async function requireAdmin(): Promise<Result<void, string>> {
  const me = await getCurrentStaff();
  if (!me) return err("ログインが必要です");
  if (me.role !== "admin") return err("管理者のみ実行できます");
  return ok(undefined);
}

function revalidateShiftUi(): void {
  revalidatePath("/calendar");
}

async function resolveStaffForShift(
  staffId: string,
): Promise<Result<{ staff_name: string; role: ShiftRole }, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("name, role")
    .eq("id", staffId)
    .maybeSingle();

  if (error || !data) {
    console.error("resolveStaffForShift failed:", error);
    return err("スタッフが見つかりません");
  }

  return ok({
    staff_name: data.name,
    role: staffRoleToShiftRole(data.role),
  });
}

export async function createShift(
  input: ShiftInput,
): Promise<Result<Shift, string>> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const parsed = shiftInputSchema.safeParse(input);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      parsed.error.flatten().formErrors[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const resolved = await resolveStaffForShift(parsed.data.staff_id);
  if (!resolved.success) return resolved;

  const me = await getCurrentStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      staff_name: resolved.data.staff_name,
      role: resolved.data.role,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      created_by: me?.id ?? null,
    })
    .select("id, staff_name, role, start_at, end_at, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("createShift failed:", error);
    return err("勤務情報の作成に失敗しました");
  }

  revalidateShiftUi();
  return ok(data);
}

export async function updateShift(
  id: string,
  input: Partial<ShiftInput>,
): Promise<Result<Shift, string>> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const parsed = shiftPartialSchema.safeParse(input);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ??
      "入力内容に問題があります";
    return err(first);
  }

  const patch: {
    staff_name?: string;
    role?: ShiftRole;
    start_at?: string;
    end_at?: string;
  } = {};

  if (parsed.data.staff_id !== undefined) {
    const resolved = await resolveStaffForShift(parsed.data.staff_id);
    if (!resolved.success) return resolved;
    patch.staff_name = resolved.data.staff_name;
    patch.role = resolved.data.role;
  }
  if (parsed.data.start_at !== undefined) patch.start_at = parsed.data.start_at;
  if (parsed.data.end_at !== undefined) patch.end_at = parsed.data.end_at;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .update(patch)
    .eq("id", id)
    .select("id, staff_name, role, start_at, end_at, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("updateShift failed:", error);
    return err("勤務情報の更新に失敗しました");
  }

  revalidateShiftUi();
  return ok(data);
}

export async function deleteShift(id: string): Promise<Result<void, string>> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").delete().eq("id", id);

  if (error) {
    console.error("deleteShift failed:", error);
    return err("勤務情報の削除に失敗しました");
  }

  revalidateShiftUi();
  return ok(undefined);
}
