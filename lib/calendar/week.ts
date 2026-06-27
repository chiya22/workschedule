import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
  weekdaySun0: number;
};

/** 店舗暦（Asia/Tokyo）上の yyyy-MM-dd */
export function calendarYmd(d: Date): string {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd");
}

export function calendarDateParts(d: Date): CalendarDateParts {
  const ymd = calendarYmd(d);
  const [year, month, day] = ymd.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const iso = Number(formatInTimeZone(d, TZ, "i"));
  const weekdaySun0 = iso === 7 ? 0 : iso;
  return { year, month, day, weekdaySun0 };
}

export function calendarDayOfMonth(d: Date): number {
  return calendarDateParts(d).day;
}

export function calendarYearMonth(d: Date): { year: number; month: number } {
  const { year, month } = calendarDateParts(d);
  return { year, month };
}

export function addCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, day] = ymd.split("-").map(Number) as [number, number, number];
  const noonUtc = fromZonedTime(
    `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00`,
    TZ,
  );
  const next = new Date(noonUtc.getTime() + deltaDays * 86_400_000);
  return formatInTimeZone(next, TZ, "yyyy-MM-dd");
}

/** ISO 曜日 1=月 … 7=日。日曜始まりの週の日曜の ymd を返す */
export function sundayYmdOfWeekContaining(ymd: string): string {
  const i = Number(formatInTimeZone(fromZonedTime(`${ymd}T12:00:00`, TZ), TZ, "i"));
  const daysBack = i === 7 ? 0 : i;
  return addCalendarDaysYmd(ymd, -daysBack);
}

export function ymdToStartOfDay(ymd: string): Date {
  return fromZonedTime(`${ymd}T00:00:00`, TZ);
}

/** 週の開始を日曜 0:00（Asia/Tokyo）に揃える */
export function startOfWeekSunday(d: Date): Date {
  const sun = sundayYmdOfWeekContaining(calendarYmd(d));
  return ymdToStartOfDay(sun);
}

export function addDays(d: Date, days: number): Date {
  return ymdToStartOfDay(addCalendarDaysYmd(calendarYmd(d), days));
}

export function endOfWeekSaturday(weekStartSunday: Date): Date {
  return addDays(weekStartSunday, 6);
}

export function weekdayLabelJa(d: Date): string {
  const { weekdaySun0 } = calendarDateParts(d);
  return WEEKDAY_JA[weekdaySun0] ?? WEEKDAY_JA[0];
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return calendarYmd(a) === calendarYmd(b);
}

export function isSameCalendarMonth(a: Date, b: Date): boolean {
  const pa = calendarDateParts(a);
  const pb = calendarDateParts(b);
  return pa.year === pb.year && pa.month === pb.month;
}

export function formatMonthRange(weekStartSunday: Date): string {
  const weekEndSat = endOfWeekSaturday(weekStartSunday);
  const y1 = calendarDateParts(weekStartSunday).year;
  const m1 = calendarDateParts(weekStartSunday).month;
  const y2 = calendarDateParts(weekEndSat).year;
  const m2 = calendarDateParts(weekEndSat).month;
  if (y1 === y2 && m1 === m2) {
    return `${y1}年${m1}月`;
  }
  return `${y1}年${m1}月 – ${y2}年${m2}月`;
}

export function startOfLocalDay(d: Date): Date {
  return ymdToStartOfDay(calendarYmd(d));
}

export function startOfCalendarMonth(d: Date): Date {
  const { year, month } = calendarDateParts(d);
  return ymdToStartOfDay(`${year}-${String(month).padStart(2, "0")}-01`);
}

export function addCalendarMonths(d: Date, deltaMonths: number): Date {
  const { year, month } = calendarDateParts(d);
  let y = year;
  let m = month + deltaMonths;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return ymdToStartOfDay(`${y}-${String(m).padStart(2, "0")}-01`);
}

export function localDateKey(d: Date): string {
  return calendarYmd(d);
}

export function calendarTodayYmd(now = new Date()): string {
  return calendarYmd(now);
}
