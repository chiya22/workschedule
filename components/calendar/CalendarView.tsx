"use client";

import { fromZonedTime } from "date-fns-tz";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { DayCalendarView } from "@/components/calendar/DayCalendarView";
import { MonthCalendarView } from "@/components/calendar/MonthCalendarView";
import { WeekCalendarPanel } from "@/components/calendar/WeekCalendarPanel";
import { NewShiftModal } from "@/components/modals/NewShiftModal";
import { ShiftDetailModal } from "@/components/modals/ShiftDetailModal";
import { useShiftsRealtime } from "@/hooks/useShiftsRealtime";
import {
  CALENDAR_DISPLAY_TIMEZONE,
  HOUR_END,
} from "@/lib/calendar/calendar-constants";
import { mapShiftToCalendar } from "@/lib/calendar/map-supabase-shift";
import type { CalendarShift } from "@/lib/calendar/types";
import {
  computeWeekOverlapLayouts,
  DAY_PX_PER_HOUR,
  WEEK_PX_PER_HOUR,
} from "@/lib/calendar/day-layout";
import {
  addMinutes,
  defaultNewShiftRangeForDay,
  slotYToStart,
} from "@/lib/calendar/datetime-ui";
import {
  addCalendarMonths,
  addDays,
  calendarYmd,
  formatMonthRange,
  startOfCalendarMonth,
  startOfLocalDay,
  startOfWeekSunday,
  ymdToStartOfDay,
} from "@/lib/calendar/week";
import type { Shift, StaffOption } from "@/types";

export type CalendarViewProps = {
  initialShifts: Shift[];
  initialView: "week" | "day" | "month";
  initialDate: string;
  initialNow: string;
  staffName: string;
  staffIsAdmin: boolean;
  staffOptions: StaffOption[];
};

function endOfBusinessDay(d: Date): Date {
  const ymd = calendarYmd(d);
  return fromZonedTime(
    `${ymd}T${String(HOUR_END).padStart(2, "0")}:00:00`,
    CALENDAR_DISPLAY_TIMEZONE,
  );
}

function useMinuteClock(initialNowIso: string): Date {
  const [now, setNow] = useState(() => new Date(initialNowIso));
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function CalendarView({
  initialShifts,
  initialView: view,
  initialDate,
  initialNow,
  staffName,
  staffIsAdmin,
  staffOptions,
}: CalendarViewProps) {
  const router = useRouter();

  const anchorDate = useMemo(() => {
    const d = new Date(initialDate);
    return Number.isNaN(d.getTime()) ? new Date(initialNow) : d;
  }, [initialDate, initialNow]);

  const weekStartSunday = useMemo(
    () => startOfWeekSunday(anchorDate),
    [anchorDate],
  );
  const daySelected = useMemo(() => startOfLocalDay(anchorDate), [anchorDate]);
  const monthAnchor = useMemo(
    () => startOfCalendarMonth(anchorDate),
    [anchorDate],
  );

  const pushCalendar = useCallback(
    (date: Date, nextView: "day" | "week" | "month") => {
      const params = new URLSearchParams();
      params.set("date", date.toISOString());
      params.set("view", nextView);
      router.push(`/calendar?${params.toString()}`);
    },
    [router],
  );

  const [showNewModal, setShowNewModal] = useState(false);
  const [newDefaultStart, setNewDefaultStart] = useState<string | undefined>();
  const [newDefaultEnd, setNewDefaultEnd] = useState<string | undefined>();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const now = useMinuteClock(initialNow);

  const { shifts: shiftRows } = useShiftsRealtime({
    initialData: initialShifts,
  });

  const shifts = useMemo(
    () => shiftRows.map(mapShiftToCalendar),
    [shiftRows],
  );

  const selectedShift = useMemo(() => {
    if (!selectedShiftId) return null;
    return shiftRows.find((s) => s.id === selectedShiftId) ?? null;
  }, [selectedShiftId, shiftRows]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartSunday, i)),
    [weekStartSunday],
  );

  const monthLabel = useMemo(
    () => formatMonthRange(weekStartSunday),
    [weekStartSunday],
  );

  const blocksByDayIndex = useMemo(
    () => weekDays.map((day) => computeWeekOverlapLayouts(shifts, day)),
    [weekDays, shifts],
  );

  const openHeaderNew = () => {
    setNewDefaultStart(undefined);
    setNewDefaultEnd(undefined);
    setShowNewModal(true);
  };

  const openSlotNewInternal = useCallback(
    (day: Date, offsetY: number, pxPerHour: number) => {
      const start = slotYToStart(day, offsetY, pxPerHour);
      let end = addMinutes(start, 8 * 60);
      const lim = endOfBusinessDay(start);
      if (end > lim) end = lim;
      setNewDefaultStart(start.toISOString());
      setNewDefaultEnd(end.toISOString());
      setShowNewModal(true);
    },
    [],
  );

  const handleShiftClick = useCallback((s: CalendarShift) => {
    setSelectedShiftId(s.id);
  }, []);

  const onSelectViewDay = () => {
    pushCalendar(startOfLocalDay(new Date()), "day");
  };

  const onSelectViewWeek = () => {
    pushCalendar(startOfWeekSunday(daySelected), "week");
  };

  const onSelectViewMonth = () => {
    let d: Date;
    if (view === "week") {
      d = addDays(weekStartSunday, 3);
    } else {
      d = daySelected;
    }
    pushCalendar(startOfCalendarMonth(d), "month");
  };

  const onDayHeaderClick = (d: Date) => {
    pushCalendar(startOfLocalDay(d), "day");
  };

  const onPickDayFromMonth = (d: Date) => {
    pushCalendar(startOfLocalDay(d), "day");
  };

  const openMonthEmptyCellNew = useCallback((d: Date) => {
    const range = defaultNewShiftRangeForDay(startOfLocalDay(d));
    setNewDefaultStart(range.start.toISOString());
    setNewDefaultEnd(range.end.toISOString());
    setShowNewModal(true);
  }, []);

  const goPrevWeek = () => pushCalendar(addDays(weekStartSunday, -7), "week");
  const goNextWeek = () => pushCalendar(addDays(weekStartSunday, 7), "week");
  const goThisWeek = () => pushCalendar(startOfWeekSunday(new Date()), "week");

  const goPrevMonth = () =>
    pushCalendar(addCalendarMonths(monthAnchor, -1), "month");
  const goNextMonth = () =>
    pushCalendar(addCalendarMonths(monthAnchor, 1), "month");
  const jumpMonth = (value: string) => {
    const [yText, mText] = value.split("-");
    const y = Number(yText);
    const m = Number(mText);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return;
    if (m < 1 || m > 12) return;
    pushCalendar(ymdToStartOfDay(`${y}-${String(m).padStart(2, "0")}-01`), "month");
  };

  return (
    <>
      {view === "week" ? (
        <WeekCalendarPanel
          weekStartSunday={weekStartSunday}
          monthLabel={monthLabel}
          weekDays={weekDays}
          blocksByDayIndex={blocksByDayIndex}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsAdmin={staffIsAdmin}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
          onThisWeek={goThisWeek}
          onOpenHeaderNew={staffIsAdmin ? openHeaderNew : undefined}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onDayHeaderClick={onDayHeaderClick}
          onSlotClick={
            staffIsAdmin
              ? (d, y) => openSlotNewInternal(d, y, WEEK_PX_PER_HOUR)
              : undefined
          }
          onShiftClick={handleShiftClick}
        />
      ) : view === "day" ? (
        <DayCalendarView
          daySelected={daySelected}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsAdmin={staffIsAdmin}
          shifts={shifts}
          onPrevDay={() =>
            pushCalendar(startOfLocalDay(addDays(daySelected, -1)), "day")
          }
          onNextDay={() =>
            pushCalendar(startOfLocalDay(addDays(daySelected, 1)), "day")
          }
          onToday={() => pushCalendar(startOfLocalDay(new Date()), "day")}
          onOpenHeaderNew={staffIsAdmin ? openHeaderNew : undefined}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onSlotClick={
            staffIsAdmin
              ? (y) => openSlotNewInternal(daySelected, y, DAY_PX_PER_HOUR)
              : undefined
          }
          onShiftClick={handleShiftClick}
        />
      ) : (
        <MonthCalendarView
          monthAnchor={monthAnchor}
          now={now}
          activeView={view}
          staffName={staffName}
          staffIsAdmin={staffIsAdmin}
          shifts={shifts}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onJumpMonth={jumpMonth}
          onOpenHeaderNew={staffIsAdmin ? openHeaderNew : undefined}
          onToday={() => pushCalendar(startOfLocalDay(new Date()), "month")}
          onSelectViewDay={onSelectViewDay}
          onSelectViewWeek={onSelectViewWeek}
          onSelectViewMonth={onSelectViewMonth}
          onPickDay={onPickDayFromMonth}
          onSlotClick={staffIsAdmin ? openMonthEmptyCellNew : undefined}
          onShiftClick={handleShiftClick}
        />
      )}

      {showNewModal && staffIsAdmin ? (
        <NewShiftModal
          key={`${newDefaultStart ?? "default"}-${newDefaultEnd ?? "default"}`}
          staffOptions={staffOptions}
          defaultStartAt={newDefaultStart}
          defaultEndAt={newDefaultEnd}
          onClose={() => {
            setShowNewModal(false);
            setNewDefaultStart(undefined);
            setNewDefaultEnd(undefined);
          }}
          onSuccess={() => router.refresh()}
        />
      ) : null}

      {selectedShift ? (
        <ShiftDetailModal
          shift={selectedShift}
          staffOptions={staffOptions}
          canEdit={staffIsAdmin}
          onClose={() => setSelectedShiftId(null)}
          onUpdated={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
