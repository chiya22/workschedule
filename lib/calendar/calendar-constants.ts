export const HOUR_START = 0;
export const HOUR_END = 24;

/**
 * カレンダー表示・勤務一覧の日付レンジ計算に使う IANA タイムゾーン。
 */
export const CALENDAR_DISPLAY_TIMEZONE = "Asia/Tokyo" as const;

/** 30分刻みの時刻オプション（HH:MM）。終了時刻用に 24:00 を含む */
export function buildTimeOptions(includeMidnightEnd = false): string[] {
  const out: string[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  if (includeMidnightEnd) {
    out.push("24:00");
  }
  return out;
}
