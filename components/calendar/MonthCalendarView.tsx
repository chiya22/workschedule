"use client";

import { useMemo, useState } from "react";
import { ShiftMonthTooltip } from "@/components/calendar/ShiftMonthTooltip";
import { CalendarMobileMenu } from "@/components/calendar/CalendarMobileMenu";
import { MonthYearPickerPopover } from "@/components/calendar/MonthYearPickerPopover";
import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import {
  calPageShell,
  calScrollX,
  calTouchAccentSm,
  calTouchNavArrow,
  calTouchOutlineSm,
  calViewSegBtn,
} from "@/lib/calendar/calendar-toolbar-classes";
import type { CalendarShift } from "@/lib/calendar/types";
import { getShiftToneClass } from "@/lib/calendar/shift-palette-classes";
import { formatMonthShiftCellLabel } from "@/lib/calendar/format-month-shift-tooltip";
import { buildMonthWeeks, isInMonth } from "@/lib/calendar/month-grid";
import {
  computeSpanSegmentsForWeek,
  isMultiDayShift,
} from "@/lib/calendar/month-span-layout";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import {
  calendarDayOfMonth,
  calendarYearMonth,
  isSameLocalDay,
} from "@/lib/calendar/week";

const WEEK_HEADER = ["日", "月", "火", "水", "木", "金", "土"] as const;
const MONTH_LANE_H = 28;
const MONTH_SPAN_TOP_PX = 40;
const MONTH_SPAN_OVERLAY_MAX_H = 72;

export type MonthCalendarViewProps = {
  monthAnchor: Date;
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsAdmin: boolean;
  shifts: CalendarShift[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpMonth: (value: string) => void;
  onOpenHeaderNew?: () => void;
  onToday: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  onPickDay: (d: Date) => void;
  onSlotClick?: (d: Date) => void;
  onShiftClick: (s: CalendarShift) => void;
};

function singleDayOnCell(shift: CalendarShift, cell: Date): boolean {
  if (isMultiDayShift(shift)) return false;
  return isSameLocalDay(shift.startAt, cell);
}

function monthTitle(d: Date): string {
  const { year, month } = calendarYearMonth(d);
  return `${year}年${month}月`;
}

export function MonthCalendarView({
  monthAnchor,
  now,
  activeView,
  staffName,
  staffIsAdmin,
  shifts,
  onPrevMonth,
  onNextMonth,
  onJumpMonth,
  onOpenHeaderNew,
  onToday,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  onPickDay,
  onSlotClick,
  onShiftClick,
}: MonthCalendarViewProps) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const weeks = useMemo(() => buildMonthWeeks(monthAnchor), [monthAnchor]);

  const weekLayouts = useMemo(
    () =>
      weeks.map((row) => {
        const segments = computeSpanSegmentsForWeek(row, shifts);
        const maxLane = segments.reduce((m, s) => Math.max(m, s.lane), -1);
        const laneBarsH = maxLane < 0 ? 0 : (maxLane + 1) * MONTH_LANE_H;
        return { row, segments, laneBarsH };
      }),
    [weeks, shifts],
  );

  return (
    <div className={calPageShell}>
      <header className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
          <button type="button" onClick={onPrevMonth} aria-label="前の月" className={calTouchNavArrow}>
            ◀
          </button>
          <div className="relative min-w-0 flex-1 sm:min-w-[7.5rem] sm:flex-none">
            <button
              type="button"
              onClick={() => setMonthPickerOpen(true)}
              aria-expanded={monthPickerOpen}
              aria-haspopup="dialog"
              className="min-h-11 min-w-0 max-w-full w-full rounded-md px-1 text-center text-[17px] font-medium leading-none text-text-primary hover:bg-bg-hover sm:px-2"
              aria-label="年月を選択"
            >
              {monthTitle(monthAnchor)}
            </button>
            <MonthYearPickerPopover
              monthAnchor={monthAnchor}
              open={monthPickerOpen}
              onClose={() => setMonthPickerOpen(false)}
              onSelectMonth={onJumpMonth}
            />
          </div>
          <button type="button" onClick={onNextMonth} aria-label="次の月" className={calTouchNavArrow}>
            ▶
          </button>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button type="button" onClick={onToday} className={calTouchOutlineSm}>
              今日
            </button>
            {staffIsAdmin && onOpenHeaderNew ? (
              <button type="button" onClick={onOpenHeaderNew} className={calTouchAccentSm}>
                <span className="sm:hidden">＋ 新規</span>
                <span className="hidden sm:inline">＋ 勤務登録</span>
              </button>
            ) : null}
            <nav className="flex items-center gap-1" aria-label="カレンダー表示切り替え">
              <button type="button" onClick={onSelectViewDay} className={calViewSegBtn(activeView === "day")}>
                日
              </button>
              <button type="button" onClick={onSelectViewWeek} className={calViewSegBtn(activeView === "week")}>
                週
              </button>
              <button type="button" onClick={onSelectViewMonth} className={calViewSegBtn(activeView === "month")}>
                月
              </button>
            </nav>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CalendarMobileMenu staffName={staffName} staffIsAdmin={staffIsAdmin} />
            <CalendarToolbarEnd staffName={staffName} staffIsAdmin={staffIsAdmin} />
          </div>
        </div>
      </header>

      <div className={calScrollX}>
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[10px] border-[0.5px] border-border bg-bg-primary">
          <div className="grid grid-cols-7 border-b-[0.5px] border-border">
            {WEEK_HEADER.map((label, i) => (
              <div
                key={i}
                className={`flex min-h-10 items-center justify-center text-[11px] ${
                  i === 0 ? "text-[#EF4444]" : i === 6 ? "text-[#3B82F6]" : "text-text-tertiary"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {weekLayouts.map(({ row, segments, laneBarsH }, wi) => {
            const spanOverlayH = Math.min(laneBarsH, MONTH_SPAN_OVERLAY_MAX_H);
            return (
              <div key={wi} className="relative grid grid-cols-7">
                {row.map((date, colIdx) => {
                  const inMonth = isInMonth(date, monthAnchor);
                  const isToday = isSameLocalDay(date, now);
                  const sunCol = colIdx === 0;
                  const satCol = colIdx === 6;
                  let cellBg = "bg-bg-primary";
                  if (!inMonth) cellBg = "bg-bg-surface";
                  else if (sunCol) cellBg = "bg-[#FFF5F5]";
                  else if (satCol) cellBg = "bg-[#F0F9FF]";

                  const singles = shifts
                    .filter((s) => singleDayOnCell(s, date))
                    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
                  const shown = singles.slice(0, 3);
                  const more = singles.length - shown.length;
                  const { year, month } = calendarYearMonth(date);
                  const dayNum = calendarDayOfMonth(date);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`relative box-border flex min-h-[124px] flex-col overflow-hidden border-b-[0.5px] border-r-[0.5px] border-border px-1 pb-1 pt-[5px] md:min-h-[136px] ${cellBg}${!staffIsAdmin || !onSlotClick ? "" : " cursor-pointer"}`}
                      onClick={() => {
                        if (!onSlotClick) return;
                        onSlotClick(date);
                      }}
                    >
                      <div className="flex shrink-0 items-start justify-start">
                        <button
                          type="button"
                          aria-label={`${year}年${month}月${dayNum}日の日表示`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPickDay(date);
                          }}
                          className="cursor-pointer touch-manipulation border-0 bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-0"
                        >
                          <span className="flex items-center gap-1">
                            <span className="relative inline-flex items-center justify-center">
                              <span
                                className={`flex min-h-9 min-w-9 items-center justify-center text-[13px] leading-none ${
                                  isToday
                                    ? "rounded-full bg-accent font-medium text-white"
                                    : inMonth
                                      ? "font-medium text-text-primary"
                                      : "font-medium text-[#D1D5DB]"
                                }`}
                              >
                                {dayNum}
                              </span>
                            </span>
                          </span>
                        </button>
                      </div>
                      <div className="flex min-h-0 shrink-0 flex-col gap-1 pt-0.5">
                        {shown.map((s) => (
                          <ShiftMonthTooltip key={s.id} shift={s}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onShiftClick(s);
                              }}
                              className={`min-h-7 max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] px-1.5 py-1 text-left text-[11px] font-medium transition-opacity duration-[120ms] hover:opacity-[0.82] touch-manipulation ${getShiftToneClass(s)}`}
                            >
                              {formatMonthShiftCellLabel(s)}
                            </button>
                          </ShiftMonthTooltip>
                        ))}
                        {more > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPickDay(date);
                            }}
                            className="min-h-7 max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] px-1.5 py-1 text-left text-[10px] font-medium leading-none text-text-secondary transition-opacity duration-[120ms] hover:opacity-[0.82] touch-manipulation"
                          >
                            他{more}件
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                <div
                  className="pointer-events-none absolute left-0 right-0 overflow-hidden"
                  style={{ top: MONTH_SPAN_TOP_PX, height: spanOverlayH }}
                >
                  {segments.map((seg) => {
                    const span = seg.endCol - seg.startCol + 1;
                    const left = (seg.startCol / 7) * 100;
                    const width = (span / 7) * 100;
                    const top = seg.lane * MONTH_LANE_H;
                    const rounded =
                      seg.roundedLeft && seg.roundedRight
                        ? "rounded-[3px]"
                        : seg.roundedLeft
                          ? "rounded-l-[3px] rounded-r-none"
                          : seg.roundedRight
                            ? "rounded-l-none rounded-r-[3px]"
                            : "rounded-none";
                    return (
                      <ShiftMonthTooltip
                        key={`${seg.shift.id}-${wi}-${seg.startCol}`}
                        shift={seg.shift}
                      >
                        <button
                          type="button"
                          style={{ left: `${left}%`, width: `${width}%`, top, height: MONTH_LANE_H }}
                          className={`pointer-events-auto absolute box-border overflow-hidden text-ellipsis whitespace-nowrap px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity duration-[120ms] hover:opacity-[0.82] touch-manipulation ${getShiftToneClass(seg.shift)} ${rounded}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onShiftClick(seg.shift);
                          }}
                        >
                          {seg.showLabel ? formatMonthShiftCellLabel(seg.shift) : ""}
                        </button>
                      </ShiftMonthTooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
