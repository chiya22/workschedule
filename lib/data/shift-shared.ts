import { z } from "zod";

export const shiftInputSchema = z
  .object({
    staff_id: z.string().uuid("スタッフを選択してください"),
    start_at: z.iso.datetime(),
    end_at: z.iso.datetime(),
  })
  .refine((data) => new Date(data.end_at) > new Date(data.start_at), {
    message: "終了時刻は開始時刻より後である必要があります",
    path: ["end_at"],
  });

export type ShiftInput = z.infer<typeof shiftInputSchema>;

export const shiftPartialSchema = z
  .object({
    staff_id: z.string().uuid("スタッフを選択してください").optional(),
    start_at: z.iso.datetime().optional(),
    end_at: z.iso.datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.start_at !== undefined && data.end_at !== undefined) {
      if (new Date(data.end_at) <= new Date(data.start_at)) {
        ctx.addIssue({
          code: "custom",
          message: "終了時刻は開始時刻より後である必要があります",
          path: ["end_at"],
        });
      }
    }
  });
