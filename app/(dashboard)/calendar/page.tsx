import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";
import { getShiftFetchRangeUtc } from "@/lib/calendar/shift-fetch-range";
import { getCurrentStaff } from "@/lib/data/auth";
import { getShiftsByDateRange } from "@/lib/data/shifts";
import { listStaffAccounts } from "@/lib/data/staff";

export const metadata: Metadata = {
  title: "勤務カレンダー | 勤務管理",
  description: "スタッフの勤務を月・週・日で表示します。",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const sp = await searchParams;

  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?message=staff_required");

  const rawView = sp.view;
  const view: "day" | "week" | "month" =
    rawView === "day" || rawView === "week" || rawView === "month"
      ? rawView
      : "month";

  const baseDate = sp.date ? new Date(sp.date) : new Date();
  const safeBase = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const { rangeStart, rangeEnd } = getShiftFetchRangeUtc(safeBase, view);

  const [shifts, staffAccounts] = await Promise.all([
    getShiftsByDateRange(rangeStart, rangeEnd),
    listStaffAccounts(),
  ]);

  const staffOptions = staffAccounts
    .filter((s) => s.role !== "admin")
    .map(({ id, name, role }) => ({
      id,
      name,
      role,
    }));

  const dateKey = safeBase.toISOString();
  const serverNow = new Date().toISOString();

  return (
    <CalendarView
      key={`${view}-${dateKey}`}
      initialShifts={shifts}
      initialView={view}
      initialDate={dateKey}
      initialNow={serverNow}
      staffName={staff.name}
      staffIsAdmin={staff.role === "admin"}
      staffOptions={staffOptions}
    />
  );
}
