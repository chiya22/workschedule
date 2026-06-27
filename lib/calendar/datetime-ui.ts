import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { HOUR_END, HOUR_START, CALENDAR_DISPLAY_TIMEZONE } from "./calendar-constants";
import { calendarYmd } from "./week";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

export function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60 * 1000);
}

function minutesToZonedDate(ymd: string, totalMinutes: number): Date {
  if (totalMinutes >= 24 * 60) {
    const nextDay = fromZonedTime(`${ymd}T00:00:00`, TZ);
    return new Date(nextDay.getTime() + totalMinutes * 60 * 1000);
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return fromZonedTime(
    `${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    TZ,
  );
}

function dayDefaultShiftRange(ymd: string): { start: Date; end: Date } {
  return {
    start: fromZonedTime(`${ymd}T09:00:00`, TZ),
    end: fromZonedTime(`${ymd}T18:00:00`, TZ),
  };
}

/** 勤務登録のデフォルト: 9:00〜18:00（指定日のカレンダー日付基準） */
export function defaultNewShiftRange(now = new Date()): {
  start: Date;
  end: Date;
} {
  return dayDefaultShiftRange(calendarYmd(now));
}

export function defaultNewShiftRangeForDay(day: Date): {
  start: Date;
  end: Date;
} {
  return dayDefaultShiftRange(calendarYmd(day));
}

export function slotYToStart(day: Date, offsetY: number, pxPerHour: number): Date {
  const ymd = calendarYmd(day);
  const minutesFromGridStart = (offsetY / pxPerHour) * 60;
  let total = HOUR_START * 60 + minutesFromGridStart;
  total = Math.round(total / 30) * 30;
  const minStart = HOUR_START * 60;
  const maxStart = HOUR_END * 60 - 30;
  total = Math.max(minStart, Math.min(maxStart, total));
  return minutesToZonedDate(ymd, total);
}

export function toDateInputValue(d: Date): string {
  return calendarYmd(d);
}

export function toTimeSelectValue(d: Date): string {
  const ymd = calendarYmd(d);
  const midnight = fromZonedTime(`${ymd}T00:00:00`, TZ);
  const nextMidnight = addMinutes(midnight, 24 * 60);
  if (d.getTime() === nextMidnight.getTime()) return "24:00";
  return formatInTimeZone(d, TZ, "HH:mm");
}

export function formatTimeHm(d: Date): string {
  return toTimeSelectValue(d);
}

export function formatHmRange(startAt: Date, endAt: Date): string {
  return `${toTimeSelectValue(startAt)}-${toTimeSelectValue(endAt)}`;
}

export function parseDateAndTime(dateStr: string, timeStr: string): Date {
  if (timeStr === "24:00") {
    const midnight = fromZonedTime(`${dateStr}T00:00:00`, TZ);
    return addMinutes(midnight, 24 * 60);
  }
  return fromZonedTime(`${dateStr}T${timeStr}:00`, TZ);
}
