import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // スタッフアカウント管理（オーナー CRUD）に必須
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // オーナー向け予約通知（Resend）。未設定時はメール送信をスキップ
  RESEND_API_KEY: z.string().min(1).optional(),
  // Resend で検証済みの送信元（例: Reservations <notify@example.com>）
  RESERVATION_NOTIFY_FROM: z.string().min(1).optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESERVATION_NOTIFY_FROM: process.env.RESERVATION_NOTIFY_FROM,
})
