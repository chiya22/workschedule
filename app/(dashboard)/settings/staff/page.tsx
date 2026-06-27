import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { StaffAccountsManager } from '@/components/settings/StaffAccountsManager'
import { getCurrentStaff } from '@/lib/data/auth'
import { listStaffAccounts } from '@/lib/data/staff'

export const metadata: Metadata = {
  title: 'アカウント管理 | 勤務管理',
  description: 'ログインアカウントの作成・更新・削除',
}

export default async function SettingsStaffPage() {
  const me = await getCurrentStaff()
  if (!me) redirect('/login?message=staff_required')
  if (me.role !== 'admin') redirect('/calendar')

  const accounts = await listStaffAccounts()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[17px] font-medium text-text-primary">アカウント管理</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/shift-import"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            CSV 取込
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          >
            カレンダーへ
          </Link>
        </div>
      </div>
      <StaffAccountsManager staff={accounts} currentUserId={me.user_id} />
    </div>
  )
}
