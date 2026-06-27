import { formatInTimeZone } from "date-fns-tz";

import {
  CALENDAR_DISPLAY_TIMEZONE,
  HOUR_END,
  HOUR_START,
} from "./calendar-constants";
import type { CalendarShift } from "./types";
import { isSameLocalDay } from "./week";

function calendarMinutesSinceMidnight(d: Date): number {
  const h = Number(formatInTimeZone(d, CALENDAR_DISPLAY_TIMEZONE, "H"));
  const m = Number(formatInTimeZone(d, CALENDAR_DISPLAY_TIMEZONE, "m"));
  const s = Number(formatInTimeZone(d, CALENDAR_DISPLAY_TIMEZONE, "s"));
  return h * 60 + m + s / 60;
}

export const DAY_HOUR_START = HOUR_START;
export const DAY_HOUR_END = HOUR_END;
export const DAY_PX_PER_HOUR = 48;

export const WEEK_HOUR_START = HOUR_START;
export const WEEK_HOUR_END = HOUR_END;
export const WEEK_PX_PER_HOUR = 40;

const GRID_START_MIN = DAY_HOUR_START * 60;
const GRID_END_MIN = DAY_HOUR_END * 60;

export type DayOverlapLayout = {
  shift: CalendarShift;
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

type Raw = {
  id: string;
  start: number;
  end: number;
  shift: CalendarShift;
  top: number;
  height: number;
};

export type OverlapLayoutConfig = {
  hourStart: number;
  hourEnd: number;
  pxPerHour: number;
  heightGapPx: number;
  minBlockHeight: number;
};

export function computeOverlapLayouts(
  shifts: CalendarShift[],
  day: Date,
  config: OverlapLayoutConfig,
): DayOverlapLayout[] {
  const gridStartMin = config.hourStart * 60;
  const gridEndMin = config.hourEnd * 60;
  const { pxPerHour, heightGapPx, minBlockHeight } = config;
  const raw: Raw[] = [];

  for (const shift of shifts) {
    if (!isSameLocalDay(shift.startAt, day)) continue;

    const startMin = calendarMinutesSinceMidnight(shift.startAt);
    const endMin = calendarMinutesSinceMidnight(shift.endAt);

    const clampedStart = Math.max(startMin, gridStartMin);
    const clampedEnd = Math.min(endMin, gridEndMin);
    if (clampedEnd <= clampedStart) continue;

    const top = ((clampedStart - gridStartMin) / 60) * pxPerHour;
    const height =
      ((clampedEnd - clampedStart) / 60) * pxPerHour - heightGapPx;

    raw.push({
      id: shift.id,
      start: clampedStart,
      end: clampedEnd,
      shift,
      top,
      height: Math.max(height, minBlockHeight),
    });
  }

  if (raw.length === 0) return [];

  const sorted = [...raw].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();

  for (const it of sorted) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane]! > it.start) {
      lane++;
    }
    if (lane === laneEnds.length) {
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    laneOf.set(it.id, lane);
  }

  const lanes = Math.max(1, laneEnds.length);

  return raw.map((it) => ({
    shift: it.shift,
    top: it.top,
    height: it.height,
    lane: laneOf.get(it.id)!,
    lanes,
  }));
}

export function computeDayOverlapLayouts(
  shifts: CalendarShift[],
  day: Date,
): DayOverlapLayout[] {
  return computeOverlapLayouts(shifts, day, {
    hourStart: DAY_HOUR_START,
    hourEnd: DAY_HOUR_END,
    pxPerHour: DAY_PX_PER_HOUR,
    heightGapPx: 4,
    minBlockHeight: 8,
  });
}

export function computeWeekOverlapLayouts(
  shifts: CalendarShift[],
  day: Date,
): DayOverlapLayout[] {
  return computeOverlapLayouts(shifts, day, {
    hourStart: WEEK_HOUR_START,
    hourEnd: WEEK_HOUR_END,
    pxPerHour: WEEK_PX_PER_HOUR,
    heightGapPx: 0,
    minBlockHeight: 8,
  });
}

export function nowMarkerTopPx(now: Date, day: Date): number | null {
  if (!isSameLocalDay(now, day)) return null;
  const mins = calendarMinutesSinceMidnight(now);
  if (mins < GRID_START_MIN || mins > GRID_END_MIN) return null;
  return ((mins - GRID_START_MIN) / 60) * DAY_PX_PER_HOUR;
}
