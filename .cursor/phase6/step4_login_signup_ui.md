# Step 4 — ログイン・サインアップ画面の実装

ログイン・サインアップ画面の UI を実装します。
`design-system.mdc` のデザイン規約に従ってください。

---

## 作業内容

### 1. ディレクトリ構造の作成

```
app/(auth)/
├── layout.tsx          ← 認証ページ用レイアウト
├── login/
│   └── page.tsx        ← ログイン画面
└── signup/
    └── page.tsx        ← サインアップ画面
```

### 2. 認証ページ用レイアウト

`app/(auth)/layout.tsx` を作成してください。
ヘッダーやサイドバーがない、認証専用のシンプルなレイアウトにします。

```tsx
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-surface p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-xl border border-border p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
```

### 3. ログイン画面

`app/(auth)/login/page.tsx` を作成してください。

```tsx
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'ログイン | 予約管理システム',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-1">ログイン</h1>
      <p className="text-sm text-text-secondary mb-6">
        メールアドレスとパスワードでログインしてください
      </p>

      {searchParams.message && (
        <div className="bg-bg-surface border border-border rounded-md p-3 mb-4 text-sm text-text-primary">
          {searchParams.message}
        </div>
      )}

      <LoginForm />

      <div className="mt-6 space-y-2 text-sm text-center">
        <Link href="/forgot-password" className="text-accent hover:underline">
          パスワードを忘れた方
        </Link>
        <p className="text-text-secondary">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-accent hover:underline">
            こちらから登録
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### 4. ログインフォームコンポーネント

`components/auth/LoginForm.tsx` を作成してください。

```tsx
'use client'

import { useState, useTransition } from 'react'
import { login } from '@/lib/auth/actions'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      // 成功時は redirect されるためここに来ない
      if (result && !result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#3B7DE8] disabled:opacity-50"
      >
        {isPending ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  )
}
```

### 5. サインアップ画面

`app/(auth)/signup/page.tsx` を作成してください。

```tsx
import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'アカウント登録 | 予約管理システム',
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: { invite?: string }
}) {
  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-1">アカウント登録</h1>
      <p className="text-sm text-text-secondary mb-6">
        メールアドレスとパスワードを登録してください
      </p>

      <SignupForm defaultInviteCode={searchParams.invite} />

      <p className="mt-6 text-sm text-center text-text-secondary">
        既にアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-accent hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
```

### 6. サインアップフォーム

`components/auth/SignupForm.tsx` を作成してください。

```tsx
'use client'

import { useState, useTransition } from 'react'
import { signup } from '@/lib/auth/actions'

type Props = {
  defaultInviteCode?: string
}

export function SignupForm({ defaultInviteCode }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccessMessage(null)

    startTransition(async () => {
      const result = await signup(formData)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSuccessMessage(result.data.message)
    })
  }

  if (successMessage) {
    return (
      <div className="bg-bg-surface border border-border rounded-md p-4 text-sm text-text-primary">
        {successMessage}
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
          パスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="invite_code" className="block text-sm font-medium text-text-primary mb-1">
          招待コード <span className="text-text-secondary">（2人目以降のスタッフのみ）</span>
        </label>
        <input
          id="invite_code"
          name="invite_code"
          type="text"
          autoComplete="off"
          defaultValue={defaultInviteCode}
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="ABCD2345"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#3B7DE8] disabled:opacity-50"
      >
        {isPending ? '登録中...' : 'アカウントを作成'}
      </button>
    </form>
  )
}
```

### 7. メール確認用ルート

`app/auth/confirm/route.ts` を作成してください。
Supabase からのメール確認リンクを処理します。

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/onboarding'

  if (token_hash && type) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=確認リンクが無効または期限切れです`)
}
```

---

## 完了条件チェック

### ファイルの作成

- [ ] `app/(auth)/layout.tsx` が作成されている
- [ ] `app/(auth)/login/page.tsx` が作成されている
- [ ] `app/(auth)/signup/page.tsx` が作成されている
- [ ] `components/auth/LoginForm.tsx` が作成されている
- [ ] `components/auth/SignupForm.tsx` が作成されている
- [ ] `app/auth/confirm/route.ts` が作成されている

### 動作確認: ログイン画面の表示

ブラウザで `http://localhost:3000/login` にアクセスして以下を確認してください。

- [ ] ログイン画面が表示される
- [ ] メールアドレス・パスワード入力欄がある
- [ ] 「パスワードを忘れた方」「こちらから登録」のリンクがある
- [ ] デザインが Linear / Vercel ライクなミニマルなスタイル

### 動作確認: サインアップ画面の表示

`/signup` にアクセスして以下を確認してください。

- [ ] サインアップ画面が表示される
- [ ] メール・パスワード・招待コード入力欄がある
- [ ] 「ログイン」へのリンクがある

### 動作確認: サインアップフロー

実際にサインアップを試して以下を確認してください。

- [ ] 不正なメールアドレスでバリデーションエラーが出る
- [ ] パスワード7文字以下でエラーが出る
- [ ] 正しい情報でサインアップすると「確認メールを送信しました」と表示される
- [ ] Supabase ダッシュボード > Authentication > Users にユーザーが追加されている
- [ ] 受信メールに確認リンクが含まれている
- [ ] 確認リンクをクリックすると `/onboarding` にリダイレクトされる

### 動作確認: ログイン

メール確認後、以下を確認してください。

- [ ] 正しいメール・パスワードでログインできる
- [ ] 間違ったパスワードでエラーメッセージが出る
- [ ] ログイン成功後、`/calendar` にリダイレクトされる
  （staff レコードがない場合は `/onboarding` にリダイレクトされるが、
  これは Step 6 の Middleware 実装後）

### コード品質

- [ ] フォームコンポーネントが `'use client'` で実装されている
- [ ] ページコンポーネントが Server Component（`'use client'` なし）
- [ ] エラーメッセージが日本語
- [ ] `useTransition` で送信中の状態が管理されている

すべてチェックできたら「Step 4 完了」と報告してください。
