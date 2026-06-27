# Step 1 — Supabase Auth の設定とサイト URL 設定

認証機能の実装に必要な Supabase 側の設定を行います。

---

## 作業内容

### 1. Supabase ダッシュボードでの認証設定

Supabase ダッシュボード > **Authentication > Providers** で以下を確認・設定してください。

#### Email プロバイダ

```
Enable Email provider             : ✅ 有効
Confirm email                     : ✅ 有効（メール確認を必須にする）
Secure email change               : ✅ 有効
Secure password change            : ✅ 有効
Minimum password length           : 8
```

#### Google OAuth（Step 5 で詳細設定）

この Step ではまだ無効のままで構いません。

### 2. URL 設定

Supabase ダッシュボード > **Authentication > URL Configuration** で設定してください。

#### Site URL（ローカル開発用）

```
http://localhost:3000
```

#### Redirect URLs

以下をすべて追加してください。

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/reset-password
```

本番環境にデプロイ後は、本番 URL も追加してください。

### 3. メールテンプレートのカスタマイズ（任意）

Supabase ダッシュボード > **Authentication > Email Templates** で
日本語のテンプレートに変更すると、エンドユーザー体験が向上します。

サブジェクト・本文を以下のように変更することを推奨します。

#### Confirm signup（サインアップ確認）

```
件名: 【予約管理システム】メールアドレスの確認

以下のリンクをクリックしてメールアドレスを確認してください。
{{ .ConfirmationURL }}

このメールに心当たりがない場合は、無視してください。
```

#### Magic Link / Reset Password も同様に日本語化してください。

### 4. 環境変数の追加

`.env.local` に以下を追加してください。

```bash
# 既存の環境変数
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxx...

# 新規追加
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` はメール内のリンクや OAuth リダイレクトで使用します。
本番環境では本番 URL に変更してください。

### 5. 環境変数バリデーションの更新

`lib/env.ts` を以下のように更新してください。

```ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
})
```

### 6. レート制限の確認

Supabase ダッシュボード > **Authentication > Rate Limits** で
デフォルトのレート制限が有効になっていることを確認してください。

```
Token verifications      : 30 per 5 minutes
Email signup/signin      : 30 per 5 minutes
SMS signup/signin        : 30 per 5 minutes
```

---

## 完了条件チェック

### Supabase 設定

Supabase ダッシュボードで以下を目視確認してください。

- [ ] Email プロバイダが有効化されている
- [ ] 「Confirm email」が有効化されている
- [ ] 最小パスワード長が 8 以上に設定されている
- [ ] Site URL に `http://localhost:3000` が設定されている
- [ ] Redirect URLs に3つの URL が追加されている

### 環境変数

- [ ] `.env.local` に `NEXT_PUBLIC_SITE_URL` が追加されている
- [ ] `lib/env.ts` のスキーマが更新されている
- [ ] `npm run dev` でアプリが起動できる
- [ ] 起動時に環境変数のバリデーションエラーが出ない

### メールテンプレート（任意）

- [ ] Confirm signup のテンプレートを日本語化した（推奨）

すべてチェックできたら「Step 1 完了」と報告してください。
不備があれば該当箇所を修正してから次の Step に進みます。
