import type { ShiftRole } from "@/types";

const MEMBER_BREAK_THRESHOLD_MINUTES = 8 * 60;
const MEMBER_BREAK_MINUTES = 60;

/** 勤務開始・終了から実働時間（分）を算出。メンバーかつ8時間以上は1時間休憩を差し引く */
export function calculateWorkMinutes(
  startAt: Date,
  endAt: Date,
  role: ShiftRole,
): number {
  const raw = Math.max(0, (endAt.getTime() - startAt.getTime()) / 60_000);
  if (role === "member" && raw >= MEMBER_BREAK_THRESHOLD_MINUTES) {
    return Math.max(0, raw - MEMBER_BREAK_MINUTES);
  }
  return raw;
}

export function formatWorkDuration(minutes: number): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function formatWorkDurationFromRange(
  startAt: Date,
  endAt: Date,
  role: ShiftRole,
): string {
  return formatWorkDuration(calculateWorkMinutes(startAt, endAt, role));
}
