# Phase 6 — 認証フロー（全体概要）

Phase 5 までの実装に加えて、認証機能を追加します。
**1店舗運用が前提**のため、シングルテナント構成で実装します。

---

## 進め方

このフェーズは以下の Step に分割されています。
**Step 1 から順番に1つずつ Cursor に渡してください。**
各 Step の完了条件をすべて満たしてから次の Step に進んでください。

```
Step 1 : Supabase Auth の設定とサイト URL 設定
Step 2 : invitations テーブルの作成と RLS
Step 3 : 認証 Server Action の実装
Step 4 : ログイン・サインアップ画面の実装
Step 5 : パスワードリセット・OAuth 連携
Step 6 : Middleware 更新とアクセス制御
Step 7 : オンボーディング画面の実装
Step 8 : 招待管理画面（オーナー専用）
Step 9 : ユーザーメニューとログアウト機能
Step 10: 総合動作確認
```

---

## ファイル構成

```
phase6_steps/
├── 00_overview.md            ← このファイル
├── step1_supabase_auth_setup.md
├── step2_invitations_table.md
├── step3_auth_actions.md
├── step4_login_signup_ui.md
├── step5_password_oauth.md
├── step6_middleware_update.md
├── step7_onboarding.md
├── step8_invitation_management.md
├── step9_user_menu.md
└── step10_verification.md
```

---

## 重要ルール

各 Step の最後には **「完了条件チェック」** が定義されています。
Cursor が完了報告をしてきたら、必ずチェックリストを1つずつ確認してから
次の Step に進んでください。

---

## 必要な Skills

このフェーズでは以下の Skills を `.cursor/rules/` に配置してください。

```
auth-patterns.mdc  ← Phase 6 用に新規追加
```

既存の Skills（design-system, supabase-patterns, data-access-layer など）も
引き続き有効です。

---

## 前提条件

Phase 5 完了済みであることを確認してください。

- [ ] カレンダー画面が Supabase からデータを取得して表示できている
- [ ] 予約の CRUD が Supabase に反映される
- [ ] Realtime 同期が動作している
- [ ] staff テーブルが存在する
- [ ] staff_role ENUM (owner, manager, staff) が定義されている

---

## トラブル時の確認順

実装中に問題が発生した場合、以下の順で確認してください。

```
1. Supabase ダッシュボード > Authentication で設定が正しいか
2. .env.local の NEXT_PUBLIC_SITE_URL が正しいか
3. middleware.ts のリダイレクトロジックが正しいか
4. ブラウザの DevTools > Application > Cookies に sb-* Cookie が
   セットされているか
5. ブラウザのコンソールにエラーが出ていないか
```
