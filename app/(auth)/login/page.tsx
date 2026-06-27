import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/data/auth'

export const metadata: Metadata = {
  title: 'ログイン | 予約カレンダー',
  description: 'スタッフ用ログイン',
}

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const staff = await getCurrentStaff()
    if (staff) redirect('/calendar')
  }

  return (
    <LoginForm
      redirectTo={sp.redirect}
      serverMessageCode={user ? (sp.message ?? 'staff_required') : undefined}
    />
  )
}
