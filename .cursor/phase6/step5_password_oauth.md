# Step 5 — パスワードリセット・OAuth 連携

パスワードリセットフローと Google OAuth ログインを実装します。

---

## 作業内容

### 1. パスワードリセット要求画面

`app/(auth)/forgot-password/page.tsx` を作成してください。

```tsx
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'パスワードリセット | 予約管理システム',
}

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-1">パスワードリセット</h1>
      <p className="text-sm text-text-secondary mb-6">
        登録済みのメールアドレスを入力してください。
        パスワード再設定用のリンクをお送りします。
      </p>

      <ForgotPasswordForm />

      <p className="mt-6 text-sm text-center">
        <Link href="/login" className="text-accent hover:underline">
          ログイン画面に戻る
        </Link>
      </p>
    </div>
  )
}
```

### 2. パスワードリセット要求フォーム

`components/auth/ForgotPasswordForm.tsx` を作成してください。

```tsx
'use client'

import { useState, useTransition } from 'react'
import { requestPasswordReset } from '@/lib/auth/actions'

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (!result.success) {
        setError(result.error)
        return
      }
      setMessage(result.data.message)
    })
  }

  if (message) {
    return (
      <div className="bg-bg-surface border border-border rounded-md p-4 text-sm text-text-primary">
        {message}
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

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#3B7DE8] disabled:opacity-50"
      >
        {isPending ? '送信中...' : 'リセットメールを送信'}
      </button>
    </form>
  )
}
```

### 3. 新パスワード設定画面

`app/(auth)/reset-password/page.tsx` を作成してください。

```tsx
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: '新しいパスワード設定 | 予約管理システム',
}

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-1">新しいパスワード設定</h1>
      <p className="text-sm text-text-secondary mb-6">
        新しいパスワードを入力してください
      </p>

      <ResetPasswordForm />
    </div>
  )
}
```

### 4. 新パスワードフォーム

`components/auth/ResetPasswordForm.tsx` を作成してください。

```tsx
'use client'

import { useState, useTransition } from 'react'
import { updatePassword } from '@/lib/auth/actions'

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)

    // パスワード一致確認
    const password = formData.get('password') as string
    const confirm = formData.get('password_confirm') as string

    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }

    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result && !result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
          新しいパスワード（8文字以上）
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
        <label htmlFor="password_confirm" className="block text-sm font-medium text-text-primary mb-1">
          パスワード確認
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          required
          autoComplete="new-password"
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
        {isPending ? '更新中...' : 'パスワードを更新'}
      </button>
    </form>
  )
}
```

### 5. OAuth コールバックルート

`app/auth/callback/route.ts` を作成してください。

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/calendar'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=認証に失敗しました`)
}
```

### 6. Google OAuth の設定（オプション）

Google ログインを有効にする場合は以下を行ってください。
**この機能はオプションです。不要であればスキップしてください。**

#### Google Cloud Console での設定

1. https://console.cloud.google.com にアクセス
2. プロジェクトを作成（既存のものを使ってもOK）
3. 「APIとサービス」 > 「認証情報」を開く
4. 「認証情報を作成」 > 「OAuth クライアント ID」
5. アプリの種類: ウェブアプリケーション
6. 承認済みのリダイレクト URI に Supabase のコールバック URL を追加
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
7. 作成後、Client ID と Client Secret を控える

#### Supabase での設定

1. Supabase ダッシュボード > Authentication > Providers > Google
2. Enable Sign in with Google を ON
3. Client ID と Client Secret を貼り付けて保存

#### ログイン画面に Google ボタン追加

`components/auth/GoogleSignInButton.tsx` を作成してください。

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { env } from '@/lib/env'

export function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="w-full border border-border rounded-lg px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-hover flex items-center justify-center gap-2"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google でログイン
    </button>
  )
}
```

ログイン画面とサインアップ画面に追加してください。

```tsx
// LoginForm の最後または最初に追加
<div className="my-4 flex items-center gap-3">
  <div className="flex-1 h-px bg-border" />
  <span className="text-xs text-text-tertiary">または</span>
  <div className="flex-1 h-px bg-border" />
</div>
<GoogleSignInButton />
```

---

## 完了条件チェック

### ファイルの作成

- [ ] `app/(auth)/forgot-password/page.tsx` が作成されている
- [ ] `app/(auth)/reset-password/page.tsx` が作成されている
- [ ] `components/auth/ForgotPasswordForm.tsx` が作成されている
- [ ] `components/auth/ResetPasswordForm.tsx` が作成されている
- [ ] `app/auth/callback/route.ts` が作成されている

### 動作確認: パスワードリセット要求

`/forgot-password` にアクセスして以下を確認してください。

- [ ] フォームが表示される
- [ ] メールアドレス入力 → 送信で「リセットメールを送信しました」が表示される
- [ ] 受信メールにリセットリンクが含まれている

### 動作確認: 新パスワード設定

リセットメールのリンクをクリックして以下を確認してください。

- [ ] `/reset-password` 画面に遷移する
- [ ] 新しいパスワード入力フォームが表示される
- [ ] パスワード不一致時にエラーが表示される
- [ ] パスワード更新後、`/calendar` にリダイレクトされる
- [ ] 新しいパスワードでログインできる

### 動作確認: Google OAuth（実装した場合のみ）

- [ ] ログイン画面に Google ログインボタンが表示される
- [ ] ボタンクリックで Google の認証画面に遷移する
- [ ] 認証完了後、アプリにログイン状態で戻ってくる
- [ ] Supabase ダッシュボード > Users に Google ユーザーが追加されている

### コード品質

- [ ] フォームコンポーネントがすべて `'use client'`
- [ ] エラーメッセージが日本語
- [ ] パスワード一致確認がクライアント側で行われている
- [ ] ResetPasswordForm でパスワード確認フィールドがある

すべてチェックできたら「Step 5 完了」と報告してください。
