"use client";

import Link from "next/link";
import { logout } from "@/lib/auth/actions";

type CalendarToolbarEndProps = {
  staffName: string | null | undefined;
  staffIsAdmin?: boolean;
};

export function CalendarToolbarEnd({
  staffName,
  staffIsAdmin = false,
}: CalendarToolbarEndProps) {
  return (
    <div className="hidden shrink-0 items-center gap-3 border-l border-border pl-3 sm:flex">
      {staffName ? (
        <span className="max-w-[160px] truncate text-xs text-text-secondary">
          {staffName}
        </span>
      ) : null}
      {staffIsAdmin ? (
        <>
          <Link
            href="/settings/shift-import"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border border-border px-4 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
          >
            CSV 取込
          </Link>
          <Link
            href="/settings/staff"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border border-border px-4 text-[11px] text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
          >
            アカウント管理
          </Link>
        </>
      ) : null}
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-border px-4 text-xs text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
