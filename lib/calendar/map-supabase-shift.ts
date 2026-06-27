import type { Shift } from "@/types";
import type { CalendarShift } from "./types";

export function mapShiftToCalendar(shift: Shift): CalendarShift {
  return {
    id: shift.id,
    staffName: shift.staff_name,
    role: shift.role,
    startAt: new Date(shift.start_at),
    endAt: new Date(shift.end_at),
  };
}
