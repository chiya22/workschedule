import type { ShiftRole, StaffRole } from "@/types";

export const SHIFT_ROLES = ["member", "part_time"] as const satisfies readonly ShiftRole[];

export const STAFF_ROLES = ["admin", "member", "part_time"] as const satisfies readonly StaffRole[];

export function shiftRoleLabelJa(role: ShiftRole): string {
  switch (role) {
    case "member":
      return "メンバー";
    case "part_time":
      return "アルバイト";
  }
}

export function staffRoleLabelJa(role: StaffRole): string {
  switch (role) {
    case "admin":
      return "管理者";
    case "member":
      return "メンバー";
    case "part_time":
      return "アルバイト";
  }
}

/** 勤務レコードの shift_role へ変換（admin は member として扱う） */
export function staffRoleToShiftRole(role: StaffRole): ShiftRole {
  return role === "part_time" ? "part_time" : "member";
}
