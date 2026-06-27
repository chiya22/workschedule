"use client";

import type { CalendarShift } from "@/lib/calendar/types";
import { formatMonthShiftTooltipLines } from "@/lib/calendar/format-month-shift-tooltip";
import type { ReactNode } from "react";

export function ShiftMonthTooltip({
  shift,
  children,
}: {
  shift: CalendarShift;
  children: ReactNode;
}) {
  const lines = formatMonthShiftTooltipLines(shift);

  return (
    <span className="group relative block max-w-full">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden min-w-[10rem] rounded-md border border-border bg-bg-primary px-2 py-1.5 text-[10px] leading-snug text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.12)] group-hover:block group-focus-within:block"
      >
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}
