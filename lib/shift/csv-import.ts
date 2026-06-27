import { fromZonedTime } from "date-fns-tz";

import { parseDateAndTime } from "@/lib/calendar/datetime-ui";
import { CALENDAR_DISPLAY_TIMEZONE } from "@/lib/calendar/calendar-constants";
import { err, ok, type Result } from "@/types/result";

const TZ = CALENDAR_DISPLAY_TIMEZONE;

export type CsvEncoding = "utf-8" | "shift_jis";

export type ShiftCsvInputRow = {
  line: number;
  loginId: string;
  workDate: string;
  startTime: string;
  endTime: string;
};

export type ParsedShiftCsvRow = ShiftCsvInputRow & {
  startAt: string;
  endAt: string;
};

export type ShiftCsvParseIssue = {
  line: number;
  message: string;
};

const WORK_DATE_HEADER = ["勤務日", "勤務日（yyyymmdd形式）"];
const START_TIME_HEADER = ["勤務開始時間", "勤務開始時間（hhmm形式）"];
const END_TIME_HEADER = ["勤務終了時間", "勤務終了時間（hhmm形式）"];

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase();
}

function isHeaderRow(cells: string[]): boolean {
  return normalizeHeader(cells[0] ?? "") === "id";
}

function mapHeaderIndices(cells: string[]): Result<
  { id: number; workDate: number; startTime: number; endTime: number },
  string
> {
  const normalized = cells.map(normalizeHeader);
  const idIdx = normalized.findIndex((c) => c === "id");
  const workDateIdx = normalized.findIndex((c) =>
    WORK_DATE_HEADER.some((h) => normalizeHeader(h) === c),
  );
  const startIdx = normalized.findIndex((c) =>
    START_TIME_HEADER.some((h) => normalizeHeader(h) === c),
  );
  const endIdx = normalized.findIndex((c) =>
    END_TIME_HEADER.some((h) => normalizeHeader(h) === c),
  );

  if (idIdx >= 0 && workDateIdx >= 0 && startIdx >= 0 && endIdx >= 0) {
    return ok({
      id: idIdx,
      workDate: workDateIdx,
      startTime: startIdx,
      endTime: endIdx,
    });
  }

  if (cells.length >= 4) {
    return ok({ id: 0, workDate: 1, startTime: 2, endTime: 3 });
  }

  return err("CSV の列構成が正しくありません（id, 勤務日, 開始, 終了）");
}

export function decodeCsvText(buffer: ArrayBuffer, encoding: CsvEncoding): string {
  const label = encoding === "shift_jis" ? "shift-jis" : "utf-8";
  return stripBom(new TextDecoder(label).decode(buffer));
}

export function parseYyyymmdd(raw: string): Result<string, string> {
  const digits = raw.replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) {
    return err("勤務日は yyyymmdd 形式で入力してください");
  }
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return err("勤務日が不正です");
  }
  const ymd = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const probe = fromZonedTime(`${ymd}T12:00:00`, TZ);
  if (Number.isNaN(probe.getTime())) {
    return err("勤務日が不正です");
  }
  return ok(ymd);
}

export function formatHhmmFromCsv(raw: string): Result<string, string> {
  const digits = raw.replace(/\D/g, "");
  if (!/^\d{3,4}$/.test(digits)) {
    return err("時刻は hhmm 形式で入力してください");
  }
  const padded = digits.padStart(4, "0");
  const hour = Number(padded.slice(0, 2));
  const minute = Number(padded.slice(2, 4));
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) {
    return err("時刻が不正です");
  }
  return ok(`${padded.slice(0, 2)}:${padded.slice(2, 4)}`);
}

export function buildShiftTimestamps(
  workDateYmd: string,
  startTimeRaw: string,
  endTimeRaw: string,
): Result<{ startAt: string; endAt: string }, string> {
  const startHm = formatHhmmFromCsv(startTimeRaw);
  if (!startHm.success) return startHm;

  const endHm = formatHhmmFromCsv(endTimeRaw);
  if (!endHm.success) return endHm;

  const startAt = parseDateAndTime(workDateYmd, startHm.data);
  const endAt = parseDateAndTime(workDateYmd, endHm.data);

  if (endAt.getTime() <= startAt.getTime()) {
    return err("終了時刻は開始時刻より後である必要があります");
  }

  return ok({
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
}

export function parseShiftCsvText(text: string): {
  rows: ShiftCsvInputRow[];
  issues: ShiftCsvParseIssue[];
} {
  const lines = stripBom(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], issues: [{ line: 1, message: "CSV にデータがありません" }] };
  }

  const firstCells = splitCsvLine(lines[0]!);
  const header = isHeaderRow(firstCells);
  const indicesResult = mapHeaderIndices(firstCells);

  if (!indicesResult.success) {
    return { rows: [], issues: [{ line: 1, message: indicesResult.error }] };
  }

  const indices = indicesResult.data;
  const dataLines = header ? lines.slice(1) : lines;
  const rows: ShiftCsvInputRow[] = [];
  const issues: ShiftCsvParseIssue[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineNo = header ? i + 2 : i + 1;
    const cells = splitCsvLine(dataLines[i]!);
    const loginId = (cells[indices.id] ?? "").trim().toLowerCase();
    const workDate = (cells[indices.workDate] ?? "").trim();
    const startTime = (cells[indices.startTime] ?? "").trim();
    const endTime = (cells[indices.endTime] ?? "").trim();

    if (!loginId && !workDate && !startTime && !endTime) continue;

    if (!loginId) {
      issues.push({ line: lineNo, message: "id が空です" });
      continue;
    }
    if (!workDate || !startTime || !endTime) {
      issues.push({ line: lineNo, message: "勤務日・開始・終了時刻は必須です" });
      continue;
    }

    rows.push({ line: lineNo, loginId, workDate, startTime, endTime });
  }

  return { rows, issues };
}

export function validateShiftCsvRow(
  row: ShiftCsvInputRow,
): Result<ParsedShiftCsvRow, string> {
  const ymd = parseYyyymmdd(row.workDate);
  if (!ymd.success) return ymd;

  const range = buildShiftTimestamps(ymd.data, row.startTime, row.endTime);
  if (!range.success) return range;

  return ok({
    ...row,
    startAt: range.data.startAt,
    endAt: range.data.endAt,
  });
}
