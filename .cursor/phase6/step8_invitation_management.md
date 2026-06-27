# Step 8 — 招待管理画面（オーナー専用）

オーナーが新しいスタッフを招待するための管理画面を実装します。

---

## 作業内容

### 1. 招待管理ページ

`app/(dashboard)/settings/staff/page.tsx` を作成してください。

```tsx
import { redirect } from 'next/navigation'
import { isOwner } from '@/lib/auth/helpers'
import { listInvitations } from '@/lib/auth/invite'
import { createClient } from '@/lib/supabase/server'
import { StaffSettingsView } from '@/components/settings/StaffSettingsView'

export const metadata = {
  title: 'スタッフ管理 | 予約管理システム',
}

export default async function StaffSettingsPage() {
  // オーナー権限チェック（middleware でもチェック済みだが二重防御）
  const owner = await isOwner()
  if (!owner) redirect('/calendar')

  // 招待一覧
  const invitations = await listInvitations()

  // スタッフ一覧
  const supabase = createClient()
  const { data: staffList } = await supabase
    .from('staff')
    .select('id, user_id, name, role, created_at')
    .order('created_at', { ascending: true })

  return (
    <StaffSettingsView
      staffList={staffList ?? []}
      invitations={invitations}
    />
  )
}
```

### 2. 招待管理ビュー

`components/settings/StaffSettingsView.tsx` を作成してください。

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInvitation, revokeInvitation } from '@/lib/auth/invite'
import { env } from '@/lib/env'
import type { Staff } from '@/types'

type Invitation = {
  id: string
  code: string
  email: string | null
  role: 'owner' | 'manager' | 'staff'
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  accepted_at: string | null
  created_at: string
  invited_by_staff: { name: string } | null
}

type Props = {
  staffList: Pick<Staff, 'id' | 'user_id' | 'name' | 'role' | 'created_at'>[]
  invitations: Invitation[]
}

export function StaffSettingsView({ staffList, invitations }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState<{ code: string; url: string } | null>(null)

  async function handleCreateInvitation(formData: FormData) {
    setError(null)
    const role = formData.get('role') as 'manager' | 'staff'

    startTransition(async () => {
      const result = await createInvitation(role)
      if (!result.success) {
        setError(result.error)
        return
      }

      const inviteUrl = `${env.NEXT_PUBLIC_SITE_URL}/signup?invite=${result.data.code}`
      setShowCode({ code: result.data.code, url: inviteUrl })
      router.refresh()
    })
  }

  async function handleRevoke(invitationId: string) {
    if (!confirm('この招待を取り消しますか？')) return

    startTransition(async () => {
      const result = await revokeInvitation(invitationId)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-xl font-medium text-text-primary">スタッフ管理</h1>
        <p className="text-sm text-text-secondary mt-1">
          スタッフの招待・管理を行います
        </p>
      </header>

      {/* 招待コード作成 */}
      <section className="border border-border rounded-lg p-5">
        <h2 className="text-base font-medium text-text-primary mb-3">スタッフを招待</h2>

        <form action={handleCreateInvitation} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-1">
              権限
            </label>
            <select
              id="role"
              name="role"
              defaultValue="staff"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option value="staff">スタッフ（予約の管理）</option>
              <option value="manager">マネージャー（テーブル設定も可）</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#3B7DE8] disabled:opacity-50"
          >
            招待コードを発行
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>
        )}

        {/* 発行された招待コードの表示 */}
        {showCode && (
          <div className="mt-4 bg-bg-surface border border-border rounded-md p-4">
            <p className="text-sm font-medium text-text-primary mb-2">招待コードを発行しました</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary w-16">コード:</span>
                <code className="bg-white border border-border rounded px-2 py-0.5 font-mono">{showCode.code}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(showCode.code)}
                  className="text-accent hover:underline text-xs"
                >
                  コピー
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary w-16">URL:</span>
                <code className="bg-white border border-border rounded px-2 py-0.5 font-mono text-xs flex-1 truncate">{showCode.url}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(showCode.url)}
                  className="text-accent hover:underline text-xs"
                >
                  コピー
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                有効期限: 7日間 / 1回のみ使用可能
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCode(null)}
              className="text-xs text-text-secondary hover:text-text-primary mt-3"
            >
              閉じる
            </button>
          </div>
        )}
      </section>

      {/* 招待中一覧 */}
      <section>
        <h2 className="text-base font-medium text-text-primary mb-3">招待中</h2>
        <PendingInvitationsList
          invitations={invitations.filter(i => i.status === 'pending')}
          onRevoke={handleRevoke}
          isPending={isPending}
        />
      </section>

      {/* スタッフ一覧 */}
      <section>
        <h2 className="text-base font-medium text-text-primary mb-3">登録済みスタッフ</h2>
        <StaffList staffList={staffList} />
      </section>
    </div>
  )
}

function PendingInvitationsList({
  invitations,
  onRevoke,
  isPending,
}: {
  invitations: Invitation[]
  onRevoke: (id: string) => void
  isPending: boolean
}) {
  if (invitations.length === 0) {
    return (
      <p className="text-sm text-text-tertiary border border-border rounded-md p-4 bg-bg-surface">
        招待中のコードはありません
      </p>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg-surface border-b border-border">
          <tr>
            <th className="text-left font-medium text-text-secondary px-4 py-2">コード</th>
            <th className="text-left font-medium text-text-secondary px-4 py-2">権限</th>
            <th className="text-left font-medium text-text-secondary px-4 py-2">期限</th>
            <th className="px-4 py-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {invitations.map(inv => (
            <tr key={inv.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3"><code className="font-mono">{inv.code}</code></td>
              <td className="px-4 py-3">{roleLabel(inv.role)}</td>
              <td className="px-4 py-3 text-text-secondary">
                {new Date(inv.expires_at).toLocaleDateString('ja-JP')}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onRevoke(inv.id)}
                  disabled={isPending}
                  className="text-red-600 hover:underline text-xs disabled:opacity-50"
                >
                  取消
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StaffList({ staffList }: { staffList: Props['staffList'] }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg-surface border-b border-border">
          <tr>
            <th className="text-left font-medium text-text-secondary px-4 py-2">名前</th>
            <th className="text-left font-medium text-text-secondary px-4 py-2">権限</th>
            <th className="text-left font-medium text-text-secondary px-4 py-2">登録日</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map(s => (
            <tr key={s.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 text-text-primary">{s.name}</td>
              <td className="px-4 py-3">{roleLabel(s.role)}</td>
              <td className="px-4 py-3 text-text-secondary">
                {new Date(s.created_at).toLocaleDateString('ja-JP')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function roleLabel(role: 'owner' | 'manager' | 'staff'): string {
  switch (role) {
    case 'owner':   return 'オーナー'
    case 'manager': return 'マネージャー'
    case 'staff':   return 'スタッフ'
  }
}
```

---

## 完了条件チェック

### ファイルの作成

- [ ] `app/(dashboard)/settings/staff/page.tsx` が作成されている
- [ ] `components/settings/StaffSettingsView.tsx` が作成されている

### 動作確認: アクセス制御

- [ ] オーナーで `/settings/staff` にアクセス → 画面が表示される
- [ ] 一般スタッフ（role: 'staff'）でアクセス → `/calendar` にリダイレクトされる
- [ ] 未ログイン状態でアクセス → `/login` にリダイレクトされる

### 動作確認: 招待コード発行

オーナーアカウントで以下を確認してください。

- [ ] 「招待コードを発行」ボタンをクリックすると招待が作成される
- [ ] 発行された招待コードと URL が画面に表示される
- [ ] コード・URL の「コピー」ボタンでクリップボードにコピーされる
- [ ] 「招待中」一覧に新しい招待が表示される
- [ ] Supabase の `invitations` テーブルにレコードが追加されている

### 動作確認: 招待の取り消し

- [ ] 「取消」ボタンで確認ダイアログが表示される
- [ ] OK で招待が削除される
- [ ] 「招待中」一覧から消える

### 動作確認: 招待コードでの登録フロー

別ブラウザ・別アカウントで以下を確認してください。

- [ ] 発行されたコードを使って `/signup?invite=...` でアクセス
- [ ] 招待コードが自動入力されている
- [ ] サインアップ → メール確認 → オンボーディング → `/calendar` までスムーズに遷移
- [ ] 完了後、`/settings/staff` の「登録済みスタッフ」一覧に追加されている
- [ ] 「招待中」一覧から該当コードが消えている（accepted になったため）
- [ ] 一度使った招待コードは再利用できない

### 動作確認: 期限切れ招待

```sql
-- 期限を過去に変更してテスト
UPDATE invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE code = 'TEST5678';
```

- [ ] 期限切れの招待コードでサインアップ後、オンボーディング送信時にエラーが表示される

### コード品質

- [ ] Server Component と Client Component が適切に分離されている
- [ ] オーナー権限チェックが Server Component 側で行われている（middleware と二重防御）
- [ ] エラーハンドリングが Result 型で行われている
- [ ] テーブル UI が `design-system.mdc` の規約に沿っている

すべてチェックできたら「Step 8 完了」と報告してください。
