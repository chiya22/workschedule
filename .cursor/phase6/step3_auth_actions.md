# Step 3 — 認証 Server Action の実装

ログイン・サインアップ・ログアウトの Server Action を実装します。

---

## 作業内容

### 1. ファイル構成

```
lib/auth/
├── actions.ts          ← このステップで作成
├── helpers.ts          ← このステップで作成
└── invite.ts           ← Step 2 で作成済み
```

### 2. lib/auth/actions.ts の実装

`'use server'` を付けて以下の関数を実装してください。

```ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import { env } from '@/lib/env'

// ============================================
// バリデーションスキーマ
// ============================================

const loginSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

const signupSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  invite_code: z.string().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
})

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

// ============================================
// Server Actions
// ============================================

/**
 * ログイン
 */
export async function login(formData: FormData): Promise<Result<void, string>> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { success: false, error: firstError ?? '入力内容に問題があります' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return {
        success: false,
        error: 'メールアドレスの確認が完了していません。受信メールを確認してください',
      }
    }
    return {
      success: false,
      error: 'メールアドレスまたはパスワードが正しくありません',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/calendar')
}

/**
 * サインアップ
 */
export async function signup(formData: FormData): Promise<Result<{ message: string }, string>> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    invite_code: formData.get('invite_code'),
  })

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { success: false, error: firstError ?? '入力内容に問題があります' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        // 招待コードを user_metadata に保存（オンボーディング時に取り出す）
        invite_code: parsed.data.invite_code ?? null,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return {
        success: false,
        error: 'このメールアドレスは既に登録されています',
      }
    }
    return { success: false, error: 'サインアップに失敗しました' }
  }

  return {
    success: true,
    data: {
      message: '確認メールを送信しました。メール内のリンクをクリックしてサインアップを完了してください',
    },
  }
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * パスワードリセットメールの送信
 */
export async function requestPasswordReset(
  formData: FormData
): Promise<Result<{ message: string }, string>> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { success: false, error: '正しいメールアドレスを入力してください' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  // メールアドレスの存在を漏らさないため、エラーでも成功メッセージを返す
  if (error) {
    console.error('Password reset failed:', error)
  }

  return {
    success: true,
    data: {
      message: 'パスワードリセット用のメールを送信しました。メールが届かない場合はメールアドレスをご確認ください',
    },
  }
}

/**
 * 新しいパスワードの設定（リセットリンクから遷移後）
 */
export async function updatePassword(
  formData: FormData
): Promise<Result<void, string>> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'パスワードは8文字以上で入力してください',
    }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'パスワードの更新に失敗しました' }
  }

  revalidatePath('/', 'layout')
  redirect('/calendar')
}
```

### 3. lib/auth/helpers.ts の実装

認証チェック用のヘルパー関数を作成してください。

```ts
import { createClient } from '@/lib/supabase/server'
import type { Staff } from '@/types'

/**
 * 認証済みユーザーを取得（未認証なら null）
 */
export async function getAuthUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 現在のスタッフ情報を取得（未登録なら null）
 */
export async function getCurrentStaff(): Promise<Staff | null> {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/**
 * 現在のスタッフがオーナーかチェック
 */
export async function isOwner(): Promise<boolean> {
  const staff = await getCurrentStaff()
  return staff?.role === 'owner'
}

/**
 * 現在のスタッフがマネージャー以上かチェック
 */
export async function isManagerOrAbove(): Promise<boolean> {
  const staff = await getCurrentStaff()
  return staff?.role === 'owner' || staff?.role === 'manager'
}
```

### 4. 既存ヘルパーとの統合

Phase 5 で作成した `lib/data/auth.ts` の `getCurrentStoreId` は1店舗運用では
不要なため、削除または無効化してください。

代わりに `lib/auth/helpers.ts` の `getCurrentStaff` を使うようにしてください。

カレンダーページなど、既存コードで `getCurrentStoreId()` を使っている箇所を
`getCurrentStaff()` に置き換えてください。

---

## 完了条件チェック

### ファイルの作成

- [ ] `lib/auth/actions.ts` が作成されている
- [ ] `lib/auth/helpers.ts` が作成されている
- [ ] `'use server'` が `actions.ts` に付与されている

### 関数の実装

- [ ] `login` が実装されている
- [ ] `signup` が実装されている
- [ ] `logout` が実装されている
- [ ] `requestPasswordReset` が実装されている
- [ ] `updatePassword` が実装されている
- [ ] `getAuthUser`, `getCurrentStaff`, `isOwner`, `isManagerOrAbove` が実装されている

### コード品質

- [ ] すべての関数で Zod バリデーションが行われている
- [ ] エラーメッセージがユーザーフレンドリーな日本語
- [ ] パスワードリセット要求時、メールアドレスの存在を漏らさない実装
- [ ] redirect の前に `revalidatePath('/', 'layout')` が呼ばれている

### 既存コードとの統合

- [ ] `getCurrentStoreId` を使っていた箇所が `getCurrentStaff` に置き換えられている
- [ ] カレンダーページが正常に表示される

### 型チェック

```bash
npx tsc --noEmit
```

- [ ] 型エラーが発生しない

すべてチェックできたら「Step 3 完了」と報告してください。
