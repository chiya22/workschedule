import type { CalendarShift } from "./types";
import { isSameLocalDay, startOfLocalDay } from "./week";

export type MonthSpanSegment = {
  shift: CalendarShift;
  lane: number;
  startCol: number;
  endCol: number;
  roundedLeft: boolean;
  roundedRight: boolean;
  showLabel: boolean;
};

export function occupiedLocalDays(shift: CalendarShift): Date[] {
  const s = startOfLocalDay(shift.startAt);
  const e = startOfLocalDay(shift.endAt);
  if (e.getTime() < s.getTime()) return [s];
  const out: Date[] = [];
  for (let t = s.getTime(); t <= e.getTime(); t += 86400000) {
    out.push(startOfLocalDay(new Date(t)));
  }
  return out;
}

export function isMultiDayShift(shift: CalendarShift): boolean {
  return occupiedLocalDays(shift).length > 1;
}

export function computeSpanSegmentsForWeek(
  weekDates: Date[],
  shifts: CalendarShift[],
): MonthSpanSegment[] {
  const multi = shifts.filter(isMultiDayShift);
  const raw: {
    shift: CalendarShift;
    startCol: number;
    endCol: number;
  }[] = [];

  for (const shift of multi) {
    const days = occupiedLocalDays(shift);
    const cols: number[] = [];
    for (let c = 0; c < 7; c++) {
      if (days.some((d) => isSameLocalDay(d, weekDates[c]!))) {
        cols.push(c);
      }
    }
    if (cols.length === 0) continue;
    raw.push({
      shift,
      startCol: cols[0]!,
      endCol: cols[cols.length - 1]!,
    });
  }

  const sorted = [...raw].sort(
    (a, b) => a.startCol - b.startCol || a.endCol - b.endCol,
  );
  const laneEndCol: number[] = [];
  const laneOf = new Map<string, number>();

  for (const it of sorted) {
    let lane = 0;
    while (lane < laneEndCol.length && laneEndCol[lane]! >= it.startCol) {
      lane++;
    }
    if (lane === laneEndCol.length) {
      laneEndCol.push(it.endCol);
    } else {
      laneEndCol[lane] = it.endCol;
    }
    laneOf.set(it.shift.id, lane);
  }

  const firstGlobal = (shift: CalendarShift) => startOfLocalDay(shift.startAt);
  const lastGlobal = (shift: CalendarShift) => {
    const ds = occupiedLocalDays(shift);
    return ds[ds.length - 1]!;
  };

  return raw.map((it) => {
    const segFirst = isSameLocalDay(weekDates[it.startCol]!, firstGlobal(it.shift));
    const segLast = isSameLocalDay(weekDates[it.endCol]!, lastGlobal(it.shift));
    return {
      shift: it.shift,
      lane: laneOf.get(it.shift.id)!,
      startCol: it.startCol,
      endCol: it.endCol,
      roundedLeft: segFirst,
      roundedRight: segLast,
      showLabel: segFirst,
    };
  });
}
