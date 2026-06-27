"use client";

import { CalendarMobileMenu } from "@/components/calendar/CalendarMobileMenu";
import { CalendarToolbarEnd } from "@/components/calendar/CalendarToolbarEnd";
import {
  calPageShell,
  calScrollX,
  calTimeGutter,
  calTouchAccentSm,
  calTouchNavArrow,
  calTouchOutlineSm,
  calViewSegBtn,
} from "@/lib/calendar/calendar-toolbar-classes";
import { HOUR_END, HOUR_START } from "@/lib/calendar/calendar-constants";
import { type DayOverlapLayout, WEEK_PX_PER_HOUR } from "@/lib/calendar/day-layout";
import { formatHmRange } from "@/lib/calendar/datetime-ui";
import { getShiftBlockClass } from "@/lib/calendar/shift-palette-classes";
import type { CalendarShift } from "@/lib/calendar/types";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { formatWorkDurationFromRange } from "@/lib/shift/work-hours";
import { shiftRoleLabelJa } from "@/lib/shift/roles";
import {
  calendarDayOfMonth,
  isSameLocalDay,
  weekdayLabelJa,
} from "@/lib/calendar/week";

function groupByLane(layouts: DayOverlapLayout[]): DayOverlapLayout[][] {
  if (layouts.length === 0) return [[]];
  const laneCount = layouts[0]!.lanes;
  const cols: DayOverlapLayout[][] = Array.from({ length: laneCount }, () => []);
  for (const L of layouts) {
    cols[L.lane]!.push(L);
  }
  return cols;
}

const HEADER_HEIGHT_PX = 64;
const PX_PER_HOUR = WEEK_PX_PER_HOUR;
const HOUR_COUNT = HOUR_END - HOUR_START;
const GRID_BODY_PX = HOUR_COUNT * PX_PER_HOUR;

const HOUR_ROWS = Array.from(
  { length: HOUR_COUNT },
  (_, i) => HOUR_START + i,
) as number[];

function WeekShiftBlock({
  shift,
  layout,
  onOpen,
}: {
  shift: CalendarShift;
  layout: { top: number; height: number };
  onOpen: (s: CalendarShift) => void;
}) {
  const workHours = formatWorkDurationFromRange(
    shift.startAt,
    shift.endAt,
    shift.role,
  );

  return (
    <div
      className={`pointer-events-auto absolute inset-x-[2px] z-[5] min-w-0 cursor-pointer touch-manipulation overflow-hidden rounded-[5px] border-l-[3px] border-solid border-y-0 border-r-0 px-[4px] py-[3px] transition-opacity duration-[120ms] ease-out hover:opacity-[0.82] sm:px-[6px] ${getShiftBlockClass(shift)}`}
      style={{ top: layout.top, height: layout.height }}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(shift);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(shift);
        }
      }}
    >
      <div className="truncate text-xs font-medium leading-tight">
        {shift.staffName}
      </div>
      <div className="mt-px truncate text-[10px] leading-tight opacity-[0.85]">
        {formatHmRange(shift.startAt, shift.endAt)}
      </div>
      <div className="mt-px truncate text-[10px] leading-tight opacity-[0.85]">
        {shiftRoleLabelJa(shift.role)} · {workHours}
      </div>
    </div>
  );
}

export type WeekCalendarPanelProps = {
  weekStartSunday: Date;
  monthLabel: string;
  weekDays: Date[];
  blocksByDayIndex: DayOverlapLayout[][];
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsAdmin: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  onOpenHeaderNew?: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  onDayHeaderClick: (d: Date) => void;
  onSlotClick?: (day: Date, offsetY: number) => void;
  onShiftClick: (s: CalendarShift) => void;
};

export function WeekCalendarPanel({
  weekStartSunday,
  monthLabel,
  weekDays,
  blocksByDayIndex,
  now,
  activeView,
  staffName,
  staffIsAdmin,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onOpenHeaderNew,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  onDayHeaderClick,
  onSlotClick,
  onShiftClick,
}: WeekCalendarPanelProps) {
  return (
    <div className={calPageShell}>
      <header className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
          <button type="button" onClick={onPrevWeek} aria-label="前の週" className={calTouchNavArrow}>
            ◀
          </button>
          <span className="min-w-[7.5rem] flex-1 text-center text-[17px] font-medium leading-none text-text-primary sm:flex-none">
            {monthLabel}
          </span>
          <button type="button" onClick={onNextWeek} aria-label="次の週" className={calTouchNavArrow}>
            ▶
          </button>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button type="button" onClick={onThisWeek} className={calTouchOutlineSm}>
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
          <div className="flex" style={{ height: HEADER_HEIGHT_PX }}>
            <div className={`${calTimeGutter} border-b-[0.5px] border-border bg-bg-primary`} />
            <div className="grid min-w-0 flex-1 grid-cols-7">
              {weekDays.map((d) => {
                const isToday = isSameLocalDay(d, now);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => onDayHeaderClick(d)}
                    className="flex min-h-[3.5rem] w-full min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 border-b-[0.5px] border-l-[0.5px] border-border bg-bg-primary py-1"
                  >
                    <span className="text-[11px] leading-none text-text-tertiary">{weekdayLabelJa(d)}</span>
                    <span className="flex min-w-0 max-w-full flex-nowrap items-center justify-center gap-1">
                      {isToday ? (
                        <span className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full bg-accent text-xs font-medium leading-none text-white">
                          {calendarDayOfMonth(d)}
                        </span>
                      ) : (
                        <span className="flex min-h-9 min-w-9 items-center justify-center text-xs font-medium leading-none text-text-primary">
                          {calendarDayOfMonth(d)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex">
            <div className={`${calTimeGutter} border-r-[0.5px] border-border bg-bg-primary`}>
              {HOUR_ROWS.map((h) => (
                <div key={h} className="box-border flex justify-end pr-1 pt-0" style={{ height: PX_PER_HOUR }}>
                  <span className="text-[10px] leading-none text-text-tertiary">{h}</span>
                </div>
              ))}
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-7">
              {weekDays.map((d, colIdx) => {
                const layouts = blocksByDayIndex[colIdx] ?? [];
                const byLane = groupByLane(layouts);
                return (
                  <div
                    key={`${weekStartSunday.toISOString()}-${colIdx}`}
                    className="relative min-w-0 border-l-[0.5px] border-border"
                    style={{ height: GRID_BODY_PX }}
                  >
                    {HOUR_ROWS.map((h) => (
                      <div
                        key={h}
                        className="pointer-events-none relative box-border border-b-[0.5px] border-border"
                        style={{ height: PX_PER_HOUR }}
                      >
                        <div
                          aria-hidden
                          className="pointer-events-none absolute left-0 right-0 top-1/2 border-t-[0.5px] border-dashed border-border opacity-50"
                        />
                      </div>
                    ))}
                    {staffIsAdmin && onSlotClick ? (
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="空きスロットから勤務を登録"
                        className="absolute inset-0 z-[1] cursor-default touch-manipulation border-0 bg-transparent p-0 outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClick(d, e.nativeEvent.offsetY);
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 z-[5] flex">
                      {byLane.map((col, laneIdx) => (
                        <div
                          key={laneIdx}
                          className={`relative min-w-0 flex-1 ${laneIdx > 0 ? "border-l-[0.5px] border-border" : ""}`}
                        >
                          {col.map((L) => (
                            <WeekShiftBlock
                              key={L.shift.id}
                              shift={L.shift}
                              layout={{ top: L.top, height: L.height }}
                              onOpen={onShiftClick}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
