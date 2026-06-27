import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ShiftCsvImportForm } from "@/components/settings/ShiftCsvImportForm";
import { getCurrentStaff } from "@/lib/data/auth";

export const metadata: Metadata = {
  title: "CSV 取込 | 勤務管理",
  description: "勤務情報を CSV から一括取り込みします",
};

export default async function ShiftImportPage() {
  const me = await getCurrentStaff();
  if (!me) redirect("/login?message=staff_required");
  if (me.role !== "admin") redirect("/calendar");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[17px] font-medium text-text-primary">CSV 取込</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/staff"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            アカウント管理
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            カレンダーへ
          </Link>
        </div>
      </div>
      <ShiftCsvImportForm />
    </div>
  );
}
