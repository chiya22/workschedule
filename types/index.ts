import type { Database } from "./database";

export type Staff = Database["public"]["Tables"]["staff"]["Row"];
export type Shift = Database["public"]["Tables"]["shifts"]["Row"];

export type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"];
export type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];

export type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"];
export type ShiftUpdate = Database["public"]["Tables"]["shifts"]["Update"];

export type StaffRole = Database["public"]["Enums"]["staff_role"];
export type ShiftRole = Database["public"]["Enums"]["shift_role"];

/** 勤務登録フォームのスタッフ選択用 */
export type StaffOption = Pick<Staff, "id" | "name" | "role">;

export type { Result } from "./result";
