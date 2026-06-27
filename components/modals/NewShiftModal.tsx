"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  addMinutes,
  defaultNewShiftRange,
  parseDateAndTime,
  toDateInputValue,
  toTimeSelectValue,
} from "@/lib/calendar/datetime-ui";
import { buildTimeOptions } from "@/lib/calendar/calendar-constants";
import { createShift } from "@/lib/data/shift-actions";
import { staffRoleLabelJa } from "@/lib/shift/roles";
import type { StaffOption } from "@/types";

function buildInitialDatetime(
  defaultStartAt: string | undefined,
  defaultEndAt: string | undefined,
) {
  if (defaultStartAt) {
    const s = new Date(defaultStartAt);
    if (!Number.isNaN(s.getTime())) {
      const end = defaultEndAt
        ? new Date(defaultEndAt)
        : addMinutes(s, 8 * 60);
      if (!Number.isNaN(end.getTime())) {
        return {
          startDate: toDateInputValue(s),
          startTime: toTimeSelectValue(s),
          endDate: toDateInputValue(end),
          endTime: toTimeSelectValue(end),
        };
      }
    }
  }
  const base = defaultNewShiftRange();
  return {
    startDate: toDateInputValue(base.start),
    startTime: toTimeSelectValue(base.start),
    endDate: toDateInputValue(base.end),
    endTime: toTimeSelectValue(base.end),
  };
}

export type NewShiftModalProps = {
  staffOptions: StaffOption[];
  defaultStartAt?: string;
  defaultEndAt?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function NewShiftModal({
  staffOptions,
  defaultStartAt,
  defaultEndAt,
  onClose,
  onSuccess,
}: NewShiftModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [staffId, setStaffId] = useState(() => staffOptions[0]?.id ?? "");
  const [datetime, setDatetime] = useState(() =>
    buildInitialDatetime(defaultStartAt, defaultEndAt),
  );
  const { startDate, startTime, endDate, endTime } = datetime;

  const startTimeOptions = buildTimeOptions(false);
  const endTimeOptions = buildTimeOptions(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!staffId) {
      setError("スタッフを選択してください");
      return;
    }

    const startAt = parseDateAndTime(startDate, startTime);
    const endAt = parseDateAndTime(endDate, endTime);

    startTransition(async () => {
      const result = await createShift({
        staff_id: staffId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSuccess?.();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-shift-title"
        className="animate-[modal-in_180ms_ease-out] w-full max-w-md rounded-xl bg-bg-primary p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="new-shift-title" className="text-sm font-medium text-text-primary">
          勤務を登録
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-text-tertiary">スタッフ</span>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-accent"
              required
            >
              {staffOptions.length === 0 ? (
                <option value="">登録済みスタッフがありません</option>
              ) : (
                staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{staffRoleLabelJa(s.role)}）
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-text-tertiary">開始日</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setDatetime((d) => ({ ...d, startDate: e.target.value }))
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-text-tertiary">開始時刻</span>
              <select
                value={startTime}
                onChange={(e) =>
                  setDatetime((d) => ({ ...d, startTime: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-accent"
                required
              >
                {startTimeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-text-tertiary">終了日</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setDatetime((d) => ({ ...d, endDate: e.target.value }))
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-text-tertiary">終了時刻</span>
              <select
                value={endTime}
                onChange={(e) =>
                  setDatetime((d) => ({ ...d, endTime: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-accent"
                required
              >
                {endTimeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="text-sm text-shift-part-time-text" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-border px-5 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-60"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || staffOptions.length === 0}
              className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-60"
            >
              {isPending ? "登録中…" : "登録"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
