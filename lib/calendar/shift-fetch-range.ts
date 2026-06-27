import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";
import {
  addCalendarDaysYmd,
  sundayYmdOfWeekContaining,
} from "@/lib/calendar/week";

type View = "day" | "week" | "month";

function daysInCalendarMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/**
 * DB の start_at/end_at と重なる勤務を取るための UTC の範囲。
 */
export function getShiftFetchRangeUtc(
  anchor: Date,
  view: View,
  tz = CALENDAR_DISPLAY_TIMEZONE,
): { rangeStart: Date; rangeEnd: Date } {
  if (view === "day") {
    const ymd = formatInTimeZone(anchor, tz, "yyyy-MM-dd");
    return {
      rangeStart: fromZonedTime(`${ymd}T00:00:00`, tz),
      rangeEnd: fromZonedTime(`${ymd}T23:59:59.999`, tz),
    };
  }

  if (view === "week") {
    const ymd = formatInTimeZone(anchor, tz, "yyyy-MM-dd");
    const sun = sundayYmdOfWeekContaining(ymd);
    const sat = addCalendarDaysYmd(sun, 6);
    return {
      rangeStart: fromZonedTime(`${sun}T00:00:00`, tz),
      rangeEnd: fromZonedTime(`${sat}T23:59:59.999`, tz),
    };
  }

  const y = Number(formatInTimeZone(anchor, tz, "yyyy"));
  const month1to12 = Number(formatInTimeZone(anchor, tz, "M"));
  const mStr = String(month1to12).padStart(2, "0");
  const lastD = daysInCalendarMonth(y, month1to12);
  const firstYmd = `${y}-${mStr}-01`;
  const lastYmd = `${y}-${mStr}-${String(lastD).padStart(2, "0")}`;

  const monthStartSunday = sundayYmdOfWeekContaining(firstYmd);
  const monthEndSaturday = addCalendarDaysYmd(
    sundayYmdOfWeekContaining(lastYmd),
    6,
  );

  return {
    rangeStart: fromZonedTime(`${monthStartSunday}T00:00:00`, tz),
    rangeEnd: fromZonedTime(`${monthEndSaturday}T23:59:59.999`, tz),
  };
}
