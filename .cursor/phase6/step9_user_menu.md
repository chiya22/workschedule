# Step 9 — ユーザーメニューとログアウト機能

ヘッダーにユーザーメニューを追加し、ログアウト機能を実装します。

---

## 作業内容

### 1. ユーザーメニューコンポーネント

`components/layout/UserMenu.tsx` を作成してください。

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/lib/auth/actions'
import type { Staff } from '@/types'

type Props = {
  staff: Pick<Staff, 'name' | 'role'>
  email: string
}

export function UserMenu({ staff, email }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Esc キーで閉じる
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const initials = staff.name.charAt(0).toUpperCase()
  const isOwner = staff.role === 'owner'

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="ユーザーメニューを開く"
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-hover transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium">
          {initials}
        </div>
        <span className="text-sm text-text-primary">{staff.name}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-64 bg-white border border-border rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-1 z-50"
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary">{staff.name}</p>
            <p className="text-xs text-text-secondary mt-0.5 truncate">{email}</p>
            <p className="text-xs text-text-tertiary mt-1">
              {roleLabel(staff.role)}
            </p>
          </div>

          {isOwner && (
            <>
              <Link
                href="/settings/staff"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-hover"
              >
                スタッフ管理
              </Link>
              <div className="border-t border-border my-1" />
            </>
          )}

          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-hover"
            >
              ログアウト
            </button>
          </form>
        </div>
      )}
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

### 2. アプリケーションヘッダー

`components/layout/AppHeader.tsx` を作成してください。
（既にヘッダーが存在する場合は UserMenu を統合してください）

```tsx
import Link from 'next/link'
import { getAuthUser, getCurrentStaff } from '@/lib/auth/helpers'
import { UserMenu } from './UserMenu'

export async function AppHeader() {
  const user = await getAuthUser()
  const staff = await getCurrentStaff()

  if (!user || !staff) return null

  return (
    <header className="border-b border-border bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/calendar" className="flex items-center gap-2">
          <span className="text-base font-medium text-text-primary">予約管理</span>
        </Link>

        <div className="flex items-center gap-2">
          <UserMenu
            staff={{ name: staff.name, role: staff.role }}
            email={user.email ?? ''}
          />
        </div>
      </div>
    </header>
  )
}
```

### 3. ダッシュボードレイアウトに組み込む

`app/(dashboard)/layout.tsx` を作成・更新してください。

```tsx
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <main>{children}</main>
    </div>
  )
}
```

ただし `/onboarding` ページではユーザーメニューを表示しないため、
オンボーディング画面は `(dashboard)` グループから出すか、
レイアウト内で条件分岐する必要があります。

**推奨**: オンボーディングを別グループにする

```
app/
├── (auth)/
├── (onboarding)/                  ← 新設
│   ├── layout.tsx                ← AppHeader なし
│   └── onboarding/page.tsx
└── (dashboard)/
    ├── layout.tsx                ← AppHeader あり
    ├── calendar/page.tsx
    └── settings/staff/page.tsx
```

`app/(onboarding)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-bg-surface">{children}</div>
}
```

### 4. ログアウト Server Action の確認

Step 3 で実装済みの `logout` 関数が正しく動作することを確認してください。

```ts
// lib/auth/actions.ts より抜粋
export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

---

## 完了条件チェック

### ファイルの作成

- [ ] `components/layout/UserMenu.tsx` が作成されている
- [ ] `components/layout/AppHeader.tsx` が作成されている
- [ ] `app/(dashboard)/layout.tsx` で AppHeader が組み込まれている
- [ ] `app/(onboarding)/layout.tsx` がヘッダーなしで作成されている（推奨）
- [ ] `/onboarding` ページが `(onboarding)` グループに移動されている

### 動作確認: ヘッダー表示

ログイン状態で `/calendar` にアクセスして以下を確認してください。

- [ ] ヘッダーが表示される
- [ ] 左側に「予約管理」のロゴ・タイトルが表示される
- [ ] 右側にユーザーアイコン（イニシャル）と名前が表示される
- [ ] スタッフのドロップダウン矢印（▼）が表示される

### 動作確認: ユーザーメニュー

- [ ] ユーザー名をクリックするとメニューが開く
- [ ] メニュー内にユーザー名・メールアドレス・権限が表示される
- [ ] オーナーの場合のみ「スタッフ管理」リンクが表示される
- [ ] マネージャー/スタッフでは「スタッフ管理」が表示されない
- [ ] メニュー外をクリックするとメニューが閉じる
- [ ] Esc キーでメニューが閉じる

### 動作確認: ログアウト

- [ ] メニュー内の「ログアウト」をクリック
- [ ] `/login` にリダイレクトされる
- [ ] 再度 `/calendar` にアクセスすると `/login` にリダイレクトされる
  （セッションがクリアされている）
- [ ] ブラウザの DevTools > Application > Cookies で sb-* Cookie が消えている

### 動作確認: ロール別動線

#### オーナーで確認

- [ ] ユーザーメニューに「スタッフ管理」が表示される
- [ ] クリックで `/settings/staff` に遷移する

#### スタッフ（role: 'staff'）で確認

```sql
-- 一時的にロール変更
UPDATE staff SET role = 'staff' WHERE user_id = '<YOUR_USER_ID>';
```

- [ ] ユーザーメニューに「スタッフ管理」が表示されない

### 動作確認: オンボーディング画面

- [ ] `/onboarding` にアクセスしてもヘッダー（ユーザーメニュー）が表示されない
- [ ] 認証ページ（`/login`, `/signup`）でもヘッダーが表示されない

### コード品質

- [ ] UserMenu が `'use client'` で実装されている
- [ ] AppHeader が Server Component（`'use client'` なし）
- [ ] アクセシビリティ属性（aria-label, role, aria-expanded）が付与されている
- [ ] 外側クリック・Esc キーでメニューが閉じる

すべてチェックできたら「Step 9 完了」と報告してください。
