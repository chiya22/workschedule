"use client";

import { useEffect, useId, useState } from "react";

import { calTouchNavArrow } from "@/lib/calendar/calendar-toolbar-classes";

const MONTH_LABELS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
] as const;

type MonthYearPickerPopoverProps = {
  monthAnchor: Date;
  open: boolean;
  onClose: () => void;
  onSelectMonth: (value: string) => void;
};

export function MonthYearPickerPopover({
  monthAnchor,
  open,
  onClose,
  onSelectMonth,
}: MonthYearPickerPopoverProps) {
  const titleId = useId();
  const [draftYear, setDraftYear] = useState(monthAnchor.getFullYear());

  useEffect(() => {
    if (open) setDraftYear(monthAnchor.getFullYear());
  }, [open, monthAnchor]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const selectedYear = monthAnchor.getFullYear();
  const selectedMonth = monthAnchor.getMonth();

  const handleSelectMonth = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    onSelectMonth(`${draftYear}-${month}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute left-1/2 top-full z-50 mt-1 w-[min(100vw-1.5rem,16rem)] -translate-x-1/2 rounded-xl border-[0.5px] border-border bg-bg-primary p-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        <p id={titleId} className="sr-only">
          年月を選択
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setDraftYear((y) => y - 1)}
            aria-label="前の年"
            className={calTouchNavArrow}
          >
            ◀
          </button>
          <span className="min-w-[5rem] text-center text-sm font-medium text-text-primary">
            {draftYear}年
          </span>
          <button
            type="button"
            onClick={() => setDraftYear((y) => y + 1)}
            aria-label="次の年"
            className={calTouchNavArrow}
          >
            ▶
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {MONTH_LABELS.map((label, monthIndex) => {
            const isSelected =
              draftYear === selectedYear && monthIndex === selectedMonth;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleSelectMonth(monthIndex)}
                className={`min-h-10 rounded-md border-[0.5px] px-2 text-xs transition-colors touch-manipulation active:scale-[0.97] ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border text-text-primary hover:bg-bg-hover"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
