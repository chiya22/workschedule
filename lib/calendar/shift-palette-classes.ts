import type { CalendarShift } from "./types";

export function getShiftBlockClass(shift: CalendarShift): string {
  if (shift.role === "member") {
    return "bg-shift-member-bg text-shift-member-text border-l-shift-member-border";
  }
  return "bg-shift-part-time-bg text-shift-part-time-text border-l-shift-part-time-border";
}

export function getShiftToneClass(shift: CalendarShift): string {
  if (shift.role === "member") {
    return "bg-shift-member-bg text-shift-member-text";
  }
  return "bg-shift-part-time-bg text-shift-part-time-text";
}
