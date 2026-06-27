import {
  addDays,
  calendarDateParts,
  isSameCalendarMonth,
  startOfLocalDay,
  startOfWeekSunday,
  ymdToStartOfDay,
} from "./week";

/** 月マトリクス用サンプル ID（mw{週ms}__{元ID}）を分解 */
export function tryParseMonthSampleId(
  id: string,
): { weekStart: Date; baseId: string } | null {
  const m = /^mw(\d+)__(.+)$/.exec(id);
  if (!m) return null;
  return { weekStart: new Date(Number(m[1])), baseId: m[2] };
}

/** 6 週 × 7 日の日付行列（日曜始まり） */
export function buildMonthWeeks(monthAnchor: Date): Date[][] {
  const { year, month } = calendarDateParts(monthAnchor);
  const gridStart = startOfWeekSunday(
    ymdToStartOfDay(`${year}-${String(month).padStart(2, "0")}-01`),
  );
  return Array.from({ length: 6 }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) =>
      startOfLocalDay(addDays(gridStart, wi * 7 + di)),
    ),
  );
}

export function isInMonth(d: Date, monthAnchor: Date): boolean {
  return isSameCalendarMonth(d, monthAnchor);
}
