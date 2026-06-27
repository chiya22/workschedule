import type { ShiftRole } from "@/types";

export type CalendarShift = {
  id: string;
  staffName: string;
  role: ShiftRole;
  startAt: Date;
  endAt: Date;
};
