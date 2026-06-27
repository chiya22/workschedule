"use client";

import { useMemo } from "react";
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
import {
  computeDayOverlapLayouts,
  type DayOverlapLayout,
  DAY_PX_PER_HOUR,
  nowMarkerTopPx,
} from "@/lib/calendar/day-layout";
import { formatTimeHm } from "@/lib/calendar/datetime-ui";
import { getShiftBlockClass } from "@/lib/calendar/shift-palette-classes";
import type { CalendarShift } from "@/lib/calendar/types";
import type { CalendarViewMode } from "@/lib/calendar/view-mode";
import { shiftRoleLabelJa } from "@/lib/shift/roles";
import {
  calculateWorkMinutes,
  formatWorkDuration,
} from "@/lib/shift/work-hours";
import {
  calendarDayOfMonth,
  calendarYearMonth,
  isSameLocalDay,
  weekdayLabelJa,
} from "@/lib/calendar/week";

const HOUR_COUNT = HOUR_END - HOUR_START;
const GRID_BODY_PX = HOUR_COUNT * DAY_PX_PER_HOUR;
const HOUR_ROWS = Array.from({ length: HOUR_COUNT }, (_, i) => HOUR_START + i) as number[];

function DayShiftBlock({
  shift,
  top,
  height,
  onOpen,
}: {
  shift: CalendarShift;
  top: number;
  height: number;
  onOpen: (s: CalendarShift) => void;
}) {
  const workHours = formatWorkDuration(
    calculateWorkMinutes(shift.startAt, shift.endAt, shift.role),
  );

  return (
    <div
      className={`pointer-events-auto absolute left-0 right-0 z-[5] cursor-pointer touch-manipulation rounded-md border-l-[3px] border-solid border-y-0 border-r-0 px-2 py-[5px] transition-opacity duration-[120ms] ease-out hover:opacity-[0.82] ${getShiftBlockClass(shift)}`}
      style={{ top, height }}
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
      <div className="text-[10px] leading-tight opacity-75">{formatTimeHm(shift.startAt)}</div>
      <div className="text-xs font-medium leading-tight text-current">{shift.staffName}</div>
      <div className="text-[10px] leading-tight opacity-80">
        {shiftRoleLabelJa(shift.role)} · {workHours}
      </div>
    </div>
  );
}

export type DayCalendarViewProps = {
  daySelected: Date;
  now: Date;
  activeView: CalendarViewMode;
  staffName: string;
  staffIsAdmin: boolean;
  shifts: CalendarShift[];
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onOpenHeaderNew?: () => void;
  onSelectViewDay: () => void;
  onSelectViewWeek: () => void;
  onSelectViewMonth: () => void;
  onSlotClick?: (offsetY: number) => void;
  onShiftClick: (s: CalendarShift) => void;
};

export function DayCalendarView({
  daySelected,
  now,
  activeView,
  staffName,
  staffIsAdmin,
  shifts,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenHeaderNew,
  onSelectViewDay,
  onSelectViewWeek,
  onSelectViewMonth,
  onSlotClick,
  onShiftClick,
}: DayCalendarViewProps) {
  const dayShifts = useMemo(
    () => shifts.filter((s) => isSameLocalDay(s.startAt, daySelected)),
    [shifts, daySelected],
  );

  const stats = useMemo(() => {
    const count = dayShifts.length;
    const totalMinutes = dayShifts.reduce(
      (sum, s) => sum + calculateWorkMinutes(s.startAt, s.endAt, s.role),
      0,
    );
    const memberCount = dayShifts.filter((s) => s.role === "member").length;
    const partTimeCount = dayShifts.filter((s) => s.role === "part_time").length;
    return { count, totalMinutes, memberCount, partTimeCount };
  }, [dayShifts]);

  const layouts = useMemo(
    () => computeDayOverlapLayouts(shifts, daySelected),
    [shifts, daySelected],
  );

  const lanes = layouts[0]?.lanes ?? 1;

  const byLane = useMemo(() => {
    const cols: DayOverlapLayout[][] = Array.from({ length: lanes }, () => []);
    for (const L of layouts) {
      cols[L.lane]!.push(L);
    }
    return cols;
  }, [layouts, lanes]);

  const markerTop = useMemo(() => nowMarkerTopPx(now, daySelected), [now, daySelected]);

  const isTitleToday = isSameLocalDay(daySelected, now);
  const { year: y, month: mo } = calendarYearMonth(daySelected);
  const wd = weekdayLabelJa(daySelected);

  return (
    <div className={calPageShell}>
      <header className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
          <button type="button" onClick={onPrevDay} aria-label="前の日" className={calTouchNavArrow}>
            ◀
          </button>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5 text-center text-[17px] font-medium leading-none text-text-primary sm:flex-none">
            <span>{y}年{mo}月</span>
            <span className="relative mx-0.5 inline-flex items-center gap-1">
              {isTitleToday ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
                  {calendarDayOfMonth(daySelected)}
                </span>
              ) : (
                <span className="flex min-h-9 min-w-9 items-center justify-center">
                  {calendarDayOfMonth(daySelected)}
                </span>
              )}
              <span>日</span>
            </span>
            <span>（{wd}）</span>
          </div>
          <button type="button" onClick={onNextDay} aria-label="次の日" className={calTouchNavArrow}>
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
          <div
            className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-border py-2 pl-[52px] pr-2 md:pl-14"
            aria-label="当日サマリー"
          >
            <span className="inline-flex min-h-9 items-center rounded-xl border-[0.5px] border-border bg-bg-hover px-3 py-1.5 text-[11px] font-medium text-text-primary">
              本日 {stats.count}件 / 実働 {formatWorkDuration(stats.totalMinutes)}
            </span>
            {stats.memberCount > 0 ? (
              <span className="inline-flex min-h-9 items-center rounded-xl border-[0.5px] border-transparent bg-shift-member-bg px-3 py-1.5 text-[11px] font-medium text-shift-member-text">
                メンバー {stats.memberCount}件
              </span>
            ) : null}
            {stats.partTimeCount > 0 ? (
              <span className="inline-flex min-h-9 items-center rounded-xl border-[0.5px] border-transparent bg-shift-part-time-bg px-3 py-1.5 text-[11px] font-medium text-shift-part-time-text">
                アルバイト {stats.partTimeCount}件
              </span>
            ) : null}
          </div>

          <div className="flex">
            <div className={`${calTimeGutter} border-r-[0.5px] border-border bg-bg-primary`}>
              {HOUR_ROWS.map((h) => (
                <div key={h} className="box-border flex justify-end pr-1 pt-0" style={{ height: DAY_PX_PER_HOUR }}>
                  <span className="text-[10px] leading-none text-text-tertiary">{h}</span>
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1" style={{ height: GRID_BODY_PX }}>
              {HOUR_ROWS.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none relative box-border border-b-[0.5px] border-border"
                  style={{ height: DAY_PX_PER_HOUR }}
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
                    onSlotClick(e.nativeEvent.offsetY);
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
                      <DayShiftBlock
                        key={L.shift.id}
                        shift={L.shift}
                        top={L.top}
                        height={L.height}
                        onOpen={onShiftClick}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {markerTop !== null ? (
                <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ top: markerTop - 1 }}>
                  <div className="relative w-full border-t-2 border-[#EF4444]">
                    <span
                      aria-hidden
                      className="absolute -left-[5px] -top-[5px] block h-[10px] w-[10px] rounded-full bg-[#EF4444]"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
