# Step 7 — オンボーディング画面の実装

新規ユーザーがサインアップ後、staff レコードを作成するためのオンボーディング画面を実装します。

---

## 作業内容

### 1. オンボーディング Server Action

`lib/auth/actions.ts` に以下の関数を追加してください。

```ts
import { consumeInviteCode } from './invite'
import type { StaffRole } from '@/types'

const onboardingSchema = z.object({
  name: z.string().min(1, 'スタッフ名を入力してください').max(50),
  invite_code: z.string().optional(),
})

/**
 * オンボーディング完了処理
 * staff レコードを作成して /calendar にリダイレクト
 */
export async function completeOnboarding(
  formData: FormData
): Promise<Result<void, string>> {
  const parsed = onboardingSchema.safeParse({
    name: formData.get('name'),
    invite_code: formData.get('invite_code'),
  })

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { success: false, error: firstError ?? '入力内容に問題があります' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  // 既に staff レコードが存在するかチェック
  const { data: existing } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect('/calendar')
  }

  // 既存のスタッフ数をチェック
  const { count } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })

  let role: StaffRole = 'owner'

  if (count && count > 0) {
    // 2人目以降は招待コードが必須
    if (!parsed.data.invite_code) {
      return {
        success: false,
        error: '既にスタッフが登録されています。招待コードを入力してください',
      }
    }

    const inviteResult = await consumeInviteCode(parsed.data.invite_code, user.id)
    if (!inviteResult.success) {
      return inviteResult
    }
    role = inviteResult.data.role
  }

  // staff レコード作成
  const { error } = await supabase.from('staff').insert({
    user_id: user.id,
    name: parsed.data.name,
    role,
  })

  if (error) {
    return { success: false, error: 'スタッフ登録に失敗しました' }
  }

  revalidatePath('/', 'layout')
  redirect('/calendar')
}

/**
 * 既存スタッフ数を取得（オンボーディング画面の表示分岐用）
 */
export async function getStaffCount(): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })
  return count ?? 0
}
```

### 2. オンボーディングページ

`app/(dashboard)/onboarding/page.tsx` を作成してください。

```tsx
import { redirect } from 'next/navigation'
import { getAuthUser, getCurrentStaff } from '@/lib/auth/helpers'
import { getStaffCount } from '@/lib/auth/actions'
import { OnboardingForm } from '@/components/auth/OnboardingForm'

export const metadata = {
  title: 'スタッフ登録 | 予約管理システム',
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { invite?: string }
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  // 既に staff 登録済みなら calendar へ
  const staff = await getCurrentStaff()
  if (staff) redirect('/calendar')

  // 既存スタッフ数を確認
  const staffCount = await getStaffCount()
  const isFirstUser = staffCount === 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-surface p-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-xl border border-border p-8">
          <h1 className="text-xl font-medium text-text-primary mb-1">
            スタッフ情報の登録
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            {isFirstUser
              ? 'お名前を入力してアカウント設定を完了してください。'
              : '招待コードとお名前を入力してください。'}
          </p>

          {isFirstUser && (
            <div className="bg-bg-surface border border-border rounded-md p-3 mb-4 text-sm text-text-primary">
              最初の登録者として、オーナー権限で登録されます
            </div>
          )}

          <OnboardingForm
            isFirstUser={isFirstUser}
            defaultInviteCode={searchParams.invite}
            userEmail={user.email ?? ''}
          />
        </div>
      </div>
    </div>
  )
}
```

### 3. オンボーディングフォーム

`components/auth/OnboardingForm.tsx` を作成してください。

```tsx
'use client'

import { useState, useTransition } from 'react'
import { completeOnboarding } from '@/lib/auth/actions'

type Props = {
  isFirstUser: boolean
  defaultInviteCode?: string
  userEmail: string
}

export function OnboardingForm({
  isFirstUser,
  defaultInviteCode,
  userEmail,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result = await completeOnboarding(formData)
      if (result && !result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          value={userEmail}
          disabled
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg-surface text-text-secondary"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          お名前
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          autoComplete="name"
          placeholder="山田 太郎"
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <p className="text-xs text-text-tertiary mt-1">
          スタッフ間で表示される名前です
        </p>
      </div>

      {!isFirstUser && (
        <div>
          <label htmlFor="invite_code" className="block text-sm font-medium text-text-primary mb-1">
            招待コード
          </label>
          <input
            id="invite_code"
            name="invite_code"
            type="text"
            required
            autoComplete="off"
            defaultValue={defaultInviteCode}
            placeholder="ABCD2345"
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent uppercase tracking-wider"
            style={{ textTransform: 'uppercase' }}
          />
          <p className="text-xs text-text-tertiary mt-1">
            オーナーから受け取った8文字のコードを入力してください
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#3B7DE8] disabled:opacity-50"
      >
        {isPending ? '登録中...' : '登録を完了する'}
      </button>
    </form>
  )
}
```

### 4. 招待リンクからの動線

招待コード付き URL からのフロー（`/signup?invite=ABCD2345`）にも対応してください。
Step 4 の SignupForm で既に `defaultInviteCode` を受け取る実装になっています。

メール確認後 `/onboarding?invite=ABCD2345` に渡すには、サインアップ時の
`emailRedirectTo` でクエリ付き URL を指定する必要があります。

`lib/auth/actions.ts` の `signup` を以下のように更新してください。

```ts
export async function signup(formData: FormData): Promise<Result<{ message: string }, string>> {
  // ... バリデーション ...

  const inviteCode = parsed.data.invite_code

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: inviteCode
        ? `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding?invite=${inviteCode}`
        : `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  // ... 残り ...
}
```

---

## 完了条件チェック

### ファイルの作成

- [ ] `lib/auth/actions.ts` に `completeOnboarding` `getStaffCount` が追加されている
- [ ] `app/(dashboard)/onboarding/page.tsx` が作成されている
- [ ] `components/auth/OnboardingForm.tsx` が作成されている

### 動作確認: 1人目のオンボーディング（オーナー登録）

事前準備として staff テーブルを空にしてください。

```sql
DELETE FROM staff;
```

新規ユーザーでサインアップ → メール確認後に以下を確認してください。

- [ ] `/onboarding` 画面が表示される
- [ ] 「最初の登録者として、オーナー権限で登録されます」と表示される
- [ ] 招待コード入力欄は表示されない
- [ ] 名前を入力して登録 → `/calendar` にリダイレクトされる
- [ ] Supabase ダッシュボードで staff レコードが作成されており、role が `owner`

### 動作確認: 2人目以降のオンボーディング（招待コード）

オーナーが Supabase ダッシュボードまたは SQL で招待コードを作成してください。

```sql
-- 任意のスタッフ ID で招待を作成
INSERT INTO invitations (code, role, invited_by, expires_at)
SELECT 'TEST1234', 'staff', id, NOW() + INTERVAL '7 days'
FROM staff
WHERE role = 'owner'
LIMIT 1;
```

別ブラウザ（または別アカウント）で以下を確認してください。

- [ ] 新規ユーザーでサインアップ → メール確認後 `/onboarding` に遷移
- [ ] 招待コード入力欄が表示される
- [ ] 招待コードなしで送信 → エラー「招待コードを入力してください」
- [ ] 不正な招待コードで送信 → エラー
- [ ] 正しい招待コードで送信 → `/calendar` にリダイレクト
- [ ] staff レコードが作成されており、role が `staff`
- [ ] invitations テーブルの該当レコードが `status: 'accepted'` に更新されている

### 動作確認: 招待リンクからのフロー

```
http://localhost:3000/signup?invite=TEST5678
```

このような URL でアクセスして以下を確認してください。

- [ ] サインアップフォームの招待コード欄に自動入力されている
- [ ] サインアップ完了後、メール確認 → `/onboarding?invite=TEST5678` に遷移
- [ ] オンボーディング画面でも招待コードが自動入力されている

### 動作確認: 既に登録済みユーザー

staff 登録済みのユーザーで `/onboarding` にアクセスして以下を確認してください。

- [ ] `/calendar` にリダイレクトされる（middleware による）

### コード品質

- [ ] フォームコンポーネントが `'use client'`
- [ ] ページコンポーネントが Server Component
- [ ] 認証状態の分岐が正しく行われている
- [ ] エラーメッセージが日本語で具体的

すべてチェックできたら「Step 7 完了」と報告してください。
