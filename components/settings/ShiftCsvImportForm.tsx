"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { importShiftsFromCsv } from "@/lib/data/shift-import-actions";
import {
  decodeCsvText,
  parseShiftCsvText,
  type CsvEncoding,
} from "@/lib/shift/csv-import";

export function ShiftCsvImportForm() {
  const router = useRouter();
  const [encoding, setEncoding] = useState<CsvEncoding>("utf-8");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    setFileName(file?.name ?? null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const input = e.currentTarget.elements.namedItem("csv-file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("CSV ファイルを選択してください");
      return;
    }

    setIsPending(true);
    try {
      const buffer = await file.arrayBuffer();
      const text = decodeCsvText(buffer, encoding);
      const { rows, issues } = parseShiftCsvText(text);

      if (issues.length > 0 && rows.length === 0) {
        setError(issues.map((i) => `${i.line}行目: ${i.message}`).join("\n"));
        return;
      }

      const importResult = await importShiftsFromCsv(rows);
      if (!importResult.success) {
        setError(importResult.error);
        return;
      }

      const { created, updated, failed } = importResult.data;
      const lines = [
        `新規 ${created} 件、更新 ${updated} 件を取り込みました。`,
        ...issues.map((i) => `${i.line}行目（解析）: ${i.message}`),
        ...failed.map((f) => `${f.line}行目: ${f.message}`),
      ].filter(Boolean);

      setResult(lines.join("\n"));
      router.refresh();
      input.value = "";
      setFileName(null);
    } catch (cause) {
      console.error("CSV import failed:", cause);
      setError("CSV の読み込みに失敗しました");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-primary p-6">
        <h2 className="text-sm font-medium text-text-primary">CSV 形式</h2>
        <p className="mt-2 text-sm text-text-secondary">
          1行目はヘッダー行としてください。列は次のとおりです。
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-bg-surface px-4 py-3 text-xs text-text-secondary">
          <code>id,勤務日,勤務開始時間,勤務終了時間</code>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-text-tertiary">
          <li>id: スタッフのログイン ID（login_id）</li>
          <li>勤務日: yyyymmdd 形式（例: 20260503）</li>
          <li>勤務開始時間・勤務終了時間: hhmm 形式（例: 0900, 1800）</li>
          <li>同一 id・同一日の勤務が既にある場合は CSV の内容で上書きします</li>
        </ul>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-bg-primary p-6">
        <label className="block">
          <span className="mb-1 block text-xs text-text-tertiary">文字コード</span>
          <select
            value={encoding}
            onChange={(e) => setEncoding(e.target.value as CsvEncoding)}
            className="w-full max-w-xs rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="utf-8">UTF-8</option>
            <option value="shift_jis">Shift_JIS（S-JIS）</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-text-tertiary">CSV ファイル</span>
          <input
            id="csv-file"
            name="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border file:bg-bg-hover file:px-4 file:py-2 file:text-xs file:text-text-primary"
            required
          />
          {fileName ? (
            <p className="mt-1 text-xs text-text-tertiary">選択中: {fileName}</p>
          ) : null}
        </label>

        {error ? (
          <pre
            className="whitespace-pre-wrap rounded-lg border border-shift-part-time-border bg-shift-part-time-bg px-3 py-2 text-sm text-shift-part-time-text"
            role="alert"
          >
            {error}
          </pre>
        ) : null}

        {result ? (
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary">
            {result}
          </pre>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-60"
        >
          {isPending ? "取り込み中…" : "取り込む"}
        </button>
      </div>
    </form>
  );
}
