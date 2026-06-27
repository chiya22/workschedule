import { createClient } from "@/lib/supabase/server";
import type { Shift } from "@/types";

const SHIFT_COLUMNS =
  "id, staff_name, role, start_at, end_at, created_by, created_at, updated_at" as const;

export async function getShiftsByDateRange(
  startAt: Date,
  endAt: Date,
): Promise<Shift[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .select(SHIFT_COLUMNS)
    .lt("start_at", endAt.toISOString())
    .gt("end_at", startAt.toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch shifts:", error);
    return [];
  }

  return data ?? [];
}

export async function getShiftById(id: string): Promise<Shift | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .select(SHIFT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to get shift:", error);
    return null;
  }

  return data;
}
