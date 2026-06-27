"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  parseDateAndTime,
  toDateInputValue,
  toTimeSelectValue,
} from "@/lib/calendar/datetime-ui";
import { buildTimeOptions } from "@/lib/calendar/calendar-constants";
import { deleteShift, updateShift } from "@/lib/data/shift-actions";
import type { StaffOption } from "@/types";
import { shiftRoleLabelJa, staffRoleLabelJa } from "@/lib/shift/roles";
import { formatWorkDurationFromRange } from "@/lib/shift/work-hours";
import type { Shift } from "@/types";

export type ShiftDetailModalProps = {
  shift: Shift;
  staffOptions: StaffOption[];
  canEdit: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

function findStaffIdForShift(
  staffOptions: StaffOption[],
  staffName: string,
): string {
  return staffOptions.find((s) => s.name === staffName)?.id ?? "";
}

export function ShiftDetailModal({
  shift,
  staffOptions,
  canEdit,
  onClose,
  onUpdated,
}: ShiftDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [staffId, setStaffId] = useState(() =>
    findStaffIdForShift(staffOptions, shift.staff_name),
  );
  const [startDate, setStartDate] = useState(() =>
    toDateInputValue(new Date(shift.start_at)),
  );
  const [startTime, setStartTime] = useState(() =>
    toTimeSelectValue(new Date(shift.start_at)),
  );
  const [endDate, setEndDate] = useState(() =>
    toDateInputValue(new Date(shift.end_at)),
  );
  const [endTime, setEndTime] = useState(() =>
    toTimeSelectValue(new Date(shift.end_at)),
  );

  const startAt = new Date(shift.start_at);
  const endAt = new Date(shift.end_at);
  const workDuration = formatWorkDurationFromRange(startAt, endAt, shift.role);

  const startTimeOptions = buildTimeOptions(false);
  const endTimeOptions = buildTimeOptions(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!staffId) {
      setError("スタッフを選択してください");
      return;
    }

    const nextStart = parseDateAndTime(startDate, startTime);
    const nextEnd = parseDateAndTime(endDate, endTime);

    startTransition(async () => {
      const result = await updateShift(shift.id, {
        staff_id: staffId,
        start_at: nextStart.toISOString(),
        end_at: nextEnd.toISOString(),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditing(false);
      onUpdated();
    });
  }

  function handleDelete() {
    if (!window.confirm("この勤務情報を削除しますか？")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteShift(shift.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onUpdated();
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
        aria-labelledby="shift-detail-title"
        className="animate-[modal-in_180ms_ease-out] w-full max-w-md rounded-xl bg-bg-primary p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shift-detail-title" className="text-sm font-medium text-text-primary">
          {editing ? "勤務を編集" : "勤務詳細"}
        </h2>

        {editing ? (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
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
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-text-tertiary">開始時刻</span>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-text-tertiary">終了時刻</span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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

            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg border border-border px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-60"
              >
                削除
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={isPending}
                  className="rounded-lg border border-border px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-60"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending || staffOptions.length === 0}
                  className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-60"
                >
                  {isPending ? "保存中…" : "保存"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-xs text-text-tertiary">スタッフ</div>
              <div className="font-medium text-text-primary">{shift.staff_name}</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">ロール</div>
              <div className="text-text-primary">{shiftRoleLabelJa(shift.role)}</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">勤務時間</div>
              <div className="text-text-primary">
                {toTimeSelectValue(startAt)} 〜 {toTimeSelectValue(endAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">実働時間</div>
              <div className="text-text-primary">{workDuration}</div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B7DE8]"
                >
                  編集
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-5 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
