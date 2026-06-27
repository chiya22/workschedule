-- Phase 6 相当（招待・オンボーディング用の DB オブジェクト）を手動で外す用の参考スクリプト。
-- 自分のプロジェクトに該当オブジェクトがない場合はエラーにならないよう IF EXISTS を使っています。
-- 実行前にバックアップを取り、SQL Editor で検証してください。

-- --- invitations まわり ---
DROP POLICY IF EXISTS "view_invitation_accepted_by_self" ON invitations;
DROP POLICY IF EXISTS "view_invitations_for_staff" ON invitations;
DROP POLICY IF EXISTS "insert_invitations_owner_only" ON invitations;
DROP POLICY IF EXISTS "update_invitations_owner_only" ON invitations;
DROP POLICY IF EXISTS "delete_invitations_owner_only" ON invitations;

DROP FUNCTION IF EXISTS consume_invitation(text, uuid);
DROP FUNCTION IF EXISTS insert_staff_for_onboarding(text, staff_role);
DROP FUNCTION IF EXISTS staff_total_count();
DROP FUNCTION IF EXISTS is_current_user_owner();

DROP POLICY IF EXISTS "onboarding_insert_own_staff" ON staff;

DROP TABLE IF EXISTS invitations CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;

-- 注意: staff_total_count / insert_staff を使っていたコードを既に削除済みであること。
-- オーナー以外の「本人による staff 登録」は、この後は owner_insert_staff ポリシー経由のみ（アプリで未実装なら手動で staff 行を用意する必要あり）。
