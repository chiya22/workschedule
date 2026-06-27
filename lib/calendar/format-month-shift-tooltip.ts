import { formatWorkDurationFromRange } from "@/lib/shift/work-hours";
import { shiftRoleLabelJa } from "@/lib/shift/roles";
import type { CalendarShift } from "./types";
import { formatTimeHm } from "./datetime-ui";

/** 月カレンダーセル内の勤務ラベル（例: 09:00-18:00 田中） */
export function formatMonthShiftCellLabel(shift: CalendarShift): string {
  return `${formatTimeHm(shift.startAt)}-${formatTimeHm(shift.endAt)} ${shift.staffName}`;
}

export function formatMonthShiftTooltipLines(shift: CalendarShift): string[] {
  const workHours = formatWorkDurationFromRange(
    shift.startAt,
    shift.endAt,
    shift.role,
  );
  return [
    shift.staffName,
    shiftRoleLabelJa(shift.role),
    `${formatTimeHm(shift.startAt)}-${formatTimeHm(shift.endAt)}`,
    `勤務 ${workHours}`,
  ];
}
