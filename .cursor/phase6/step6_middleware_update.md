# Step 6 — Middleware 更新とアクセス制御

認証状態と staff 登録状態に応じたページアクセス制御を実装します。

---

## 作業内容

### 1. Middleware の更新

プロジェクトルートの `middleware.ts` を以下の内容で書き換えてください。
Phase 5 で作成したシンプルな実装を、認証フローに対応した版に更新します。

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ✅ 必ず getUser() を使う（getSession ではない）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // パスの分類
  const isAuthPath =
    path === '/login' ||
    path === '/signup' ||
    path === '/forgot-password' ||
    path === '/reset-password'

  const isOnboarding = path === '/onboarding'

  const isProtected =
    path.startsWith('/calendar') || path.startsWith('/settings')

  // ============================================
  // ルール 1: 未ログインで保護ページ → /login へ
  // ============================================
  if (!user && (isProtected || isOnboarding)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // ============================================
  // ルール 2: ログイン済みで認証ページ → /calendar へ
  // ※ ただし reset-password はログイン直後のフローなので例外
  // ============================================
  if (
    user &&
    (path === '/login' || path === '/signup' || path === '/forgot-password')
  ) {
    return NextResponse.redirect(new URL('/calendar', request.url))
  }

  // ============================================
  // ルール 3: ログイン済みで保護ページ → staff 登録チェック
  // ============================================
  if (user && isProtected) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    // staff レコードがない → オンボーディングへ
    if (!staff) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // /settings/staff はオーナーのみアクセス可
    if (path.startsWith('/settings/staff') && staff.role !== 'owner') {
      return NextResponse.redirect(new URL('/calendar', request.url))
    }
  }

  // ============================================
  // ルール 4: staff 登録済みで /onboarding → /calendar へ
  // ============================================
  if (user && isOnboarding) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (staff) {
      return NextResponse.redirect(new URL('/calendar', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
}
```

### 2. リダイレクト後のクエリパラメータ対応（任意）

ログイン画面で `?redirect=/calendar` パラメータがある場合、
ログイン後にそのページに戻る実装を行うこともできます。

`lib/auth/actions.ts` の `login` 関数を以下のように更新してください。

```ts
export async function login(formData: FormData): Promise<Result<void, string>> {
  // ... バリデーション ...

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // ... エラー処理 ...
  }

  revalidatePath('/', 'layout')

  // リダイレクト先の指定があればそこへ、なければ /calendar
  const redirectTo = formData.get('redirect') as string | null
  redirect(redirectTo || '/calendar')
}
```

ログインフォームに hidden input を追加してください。

```tsx
// LoginForm.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/calendar'

  // ... 既存のコード ...

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      {/* 既存のフォームフィールド */}
    </form>
  )
}
```

---

## 完了条件チェック

### コード

- [ ] `middleware.ts` が更新されている
- [ ] 4つのリダイレクトルールが実装されている
- [ ] `getUser()` を使用している（`getSession` ではない）
- [ ] パスの分類が正しい

### 動作確認: 未ログイン状態

ブラウザでログアウト状態にした上で以下を確認してください。

- [ ] `/calendar` にアクセス → `/login?redirect=/calendar` にリダイレクトされる
- [ ] `/settings` にアクセス → `/login` にリダイレクトされる
- [ ] `/onboarding` にアクセス → `/login` にリダイレクトされる
- [ ] `/login` には直接アクセスできる
- [ ] `/signup` には直接アクセスできる

### 動作確認: ログイン済み・staff 未登録

新規ユーザーでログインし、staff レコードを作成しない状態で以下を確認してください。

- [ ] `/calendar` にアクセス → `/onboarding` にリダイレクトされる
- [ ] `/settings` にアクセス → `/onboarding` にリダイレクトされる
- [ ] `/login` にアクセス → `/calendar` にリダイレクトされる
  （staff がないので結果的に `/onboarding` に再リダイレクト）

### 動作確認: ログイン済み・staff 登録済み（オーナー）

オーナーのスタッフレコードがある状態で以下を確認してください。

```sql
-- 確認用 SQL
INSERT INTO staff (user_id, name, role)
VALUES ('<YOUR_USER_ID>', 'テスト オーナー', 'owner');
```

- [ ] `/calendar` にアクセスできる
- [ ] `/settings/staff` にアクセスできる
- [ ] `/onboarding` にアクセス → `/calendar` にリダイレクトされる
- [ ] `/login` にアクセス → `/calendar` にリダイレクトされる

### 動作確認: ログイン済み・staff 登録済み（staff ロール）

`role: 'staff'` のスタッフレコードがある状態で以下を確認してください。

```sql
UPDATE staff SET role = 'staff' WHERE user_id = '<YOUR_USER_ID>';
```

- [ ] `/calendar` にアクセスできる
- [ ] `/settings/staff` にアクセス → `/calendar` にリダイレクトされる（オーナー専用）

### 動作確認: リダイレクト先パラメータ

- [ ] 未ログインで `/settings` にアクセス
- [ ] `/login?redirect=/settings` にリダイレクトされる
- [ ] ログインフォームに hidden input が存在する
- [ ] ログイン成功後、`/settings` に遷移する

すべてチェックできたら「Step 6 完了」と報告してください。
