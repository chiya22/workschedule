"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth/actions";

const hamburgerBtn =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-bg-primary text-text-secondary transition-transform duration-100 hover:bg-bg-hover active:scale-[0.97] touch-manipulation";

const menuLinkClass =
  "flex min-h-11 w-full items-center rounded-lg border-[0.5px] border-border px-4 text-xs text-text-primary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]";

type CalendarMobileMenuProps = {
  staffName: string | null | undefined;
  staffIsAdmin: boolean;
};

export function CalendarMobileMenu({
  staffName,
  staffIsAdmin,
}: CalendarMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="z-20 shrink-0 sm:hidden">
      <button
        type="button"
        className={hamburgerBtn}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden className="flex w-5 flex-col gap-1">
          <span className="h-[2px] w-full rounded-sm bg-text-secondary" />
          <span className="h-[2px] w-full rounded-sm bg-text-secondary" />
          <span className="h-[2px] w-full rounded-sm bg-text-secondary" />
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="オーバーレイを閉じる"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
            onClick={close}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="カレンダーメニュー"
            className="fixed inset-y-0 right-0 z-[101] flex w-[min(100vw,18rem)] flex-col border-l-[0.5px] border-border bg-bg-primary pt-[env(safe-area-inset-top,0px)] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center justify-between border-b-[0.5px] border-border px-4 py-3">
              <span className="text-xs font-medium text-text-primary">メニュー</span>
              <button
                type="button"
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-sm text-text-secondary hover:bg-bg-hover touch-manipulation"
                aria-label="閉じる"
                onClick={close}
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
              {staffName ? (
                <p className="mb-4 truncate text-xs text-text-secondary">{staffName}</p>
              ) : null}

              {staffIsAdmin ? (
                <nav className="flex flex-col gap-2" aria-label="設定">
                  <Link href="/settings/shift-import" className={menuLinkClass} onClick={close}>
                    CSV 取込
                  </Link>
                  <Link href="/settings/staff" className={menuLinkClass} onClick={close}>
                    アカウント管理
                  </Link>
                </nav>
              ) : null}

              <div className="mt-4 border-t-[0.5px] border-border pt-4">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center justify-center rounded-lg border-[0.5px] border-border px-4 text-xs text-text-secondary transition-colors hover:bg-bg-hover touch-manipulation active:scale-[0.97]"
                  >
                    ログアウト
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
