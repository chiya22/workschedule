# Step 2 — invitations テーブルの作成と RLS

スタッフ招待用のテーブルを作成します。

---

## 作業内容

### 1. マイグレーションファイルの作成

`supabase/migrations/` に新しいマイグレーションファイルを作成してください。
タイムスタンプは作業時の日時に置き換えてください。

```
20250505100001_create_invitations.sql
20250505100002_rls_invitations.sql
```

### 2. invitations テーブルの作成

`20250505100001_create_invitations.sql` の内容:

```sql
-- 招待ステータス
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- 招待テーブル
CREATE TABLE invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  email         TEXT,
  role          staff_role NOT NULL DEFAULT 'staff',
  invited_by    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  status        invitation_status NOT NULL DEFAULT 'pending',
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at   TIMESTAMPTZ,
  accepted_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_code ON invitations(code) WHERE status = 'pending';
CREATE INDEX idx_invitations_status ON invitations(status);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
```

### 3. RLS ポリシーの作成

`20250505100002_rls_invitations.sql` の内容:

```sql
-- ヘルパー関数: 現在のユーザーがオーナーかどうか
CREATE OR REPLACE FUNCTION is_current_user_owner()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- SELECT: スタッフ全員が閲覧可（コード自体は使用時にのみ表示）
CREATE POLICY "view_invitations_for_staff" ON invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid())
  );

-- INSERT: オーナーのみ作成可
CREATE POLICY "insert_invitations_owner_only" ON invitations
  FOR INSERT WITH CHECK (is_current_user_owner());

-- UPDATE: オーナーのみ更新可（招待の取り消しなど）
CREATE POLICY "update_invitations_owner_only" ON invitations
  FOR UPDATE USING (is_current_user_owner());

-- DELETE: オーナーのみ削除可
CREATE POLICY "delete_invitations_owner_only" ON invitations
  FOR DELETE USING (is_current_user_owner());
```

### 4. 招待コード生成・消費ロジックの実装

`lib/auth/invite.ts` を作成してください。

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import type { StaffRole } from '@/types'

/**
 * ランダムな招待コードを生成（8文字の英数字）
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字を除外
  let code = ''
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

/**
 * 招待を作成する（オーナーのみ）
 */
export async function createInvitation(
  role: Exclude<StaffRole, 'owner'>,
  email?: string
): Promise<Result<{ code: string; expires_at: string }, string>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '認証が必要です' }

  const { data: currentStaff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!currentStaff || currentStaff.role !== 'owner') {
    return { success: false, error: 'オーナー権限が必要です' }
  }

  const code = generateInviteCode()
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      code,
      email: email ?? null,
      role,
      invited_by: currentStaff.id,
    })
    .select('code, expires_at')
    .single()

  if (error || !data) {
    return { success: false, error: '招待の作成に失敗しました' }
  }

  return { success: true, data }
}

/**
 * 招待コードを消費して、role を返す
 */
export async function consumeInviteCode(
  code: string,
  userId: string
): Promise<Result<{ role: StaffRole }, string>> {
  const supabase = createClient()

  // pending かつ未失効の招待を検索
  const { data: invitation } = await supabase
    .from('invitations')
    .select('id, role, expires_at, status')
    .eq('code', code)
    .eq('status', 'pending')
    .maybeSingle()

  if (!invitation) {
    return {
      success: false,
      error: '招待コードが正しくないか、既に使用されています',
    }
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // 期限切れに更新
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)

    return { success: false, error: '招待コードの有効期限が切れています' }
  }

  // 受諾として更新
  const { error } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
    })
    .eq('id', invitation.id)

  if (error) {
    return { success: false, error: '招待の処理に失敗しました' }
  }

  return { success: true, data: { role: invitation.role } }
}

/**
 * 招待の一覧を取得（オーナーのみ）
 */
export async function listInvitations() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      code,
      email,
      role,
      status,
      expires_at,
      accepted_at,
      created_at,
      invited_by_staff:staff!invitations_invited_by_fkey (name)
    `)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

/**
 * 招待を取り消す（オーナーのみ）
 */
export async function revokeInvitation(
  invitationId: string
): Promise<Result<void, string>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('status', 'pending')

  if (error) {
    return { success: false, error: '招待の取り消しに失敗しました' }
  }

  return { success: true, data: undefined }
}
```

### 5. マイグレーションの適用

Supabase MCP の `apply_migration` ツールで適用してください。

### 6. 型定義の再生成

invitations テーブルが追加されたので、型を再生成してください。

```bash
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > types/database.ts
```

`types/index.ts` に型エイリアスを追加してください。

```ts
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type InvitationStatus = Database['public']['Enums']['invitation_status']
```

---

## 完了条件チェック

### マイグレーション

- [ ] `20250505100001_create_invitations.sql` が作成されている
- [ ] `20250505100002_rls_invitations.sql` が作成されている
- [ ] 両マイグレーションが Supabase に適用されている

### Supabase ダッシュボードでの確認

- [ ] Table Editor に `invitations` テーブルが存在する
- [ ] `invitations` テーブルで RLS が有効化されている
- [ ] `invitation_status` ENUM 型が定義されている

### SQL での確認

Supabase の SQL Editor で以下を実行してください。

```sql
-- ポリシー確認
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'invitations';

-- ヘルパー関数確認
SELECT proname FROM pg_proc WHERE proname = 'is_current_user_owner';
```

- [ ] invitations テーブルに4つのポリシーが存在する
- [ ] `is_current_user_owner` 関数が存在する

### コード

- [ ] `lib/auth/invite.ts` が作成されている
- [ ] `createInvitation`, `consumeInviteCode`, `listInvitations`, `revokeInvitation` の4関数が実装されている
- [ ] `'use server'` がファイルに付与されている
- [ ] `types/database.ts` が再生成されている
- [ ] `types/index.ts` に Invitation 型エイリアスが追加されている

### 型チェック

```bash
npx tsc --noEmit
```

- [ ] 型エラーが発生しない

すべてチェックできたら「Step 2 完了」と報告してください。
