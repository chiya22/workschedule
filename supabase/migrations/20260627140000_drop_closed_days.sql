-- 休業日機能廃止: closed_days テーブルを削除

DROP TRIGGER IF EXISTS update_closed_days_updated_at ON closed_days;

DROP POLICY IF EXISTS "staff_select_closed_days" ON closed_days;
DROP POLICY IF EXISTS "admin_insert_closed_days" ON closed_days;
DROP POLICY IF EXISTS "admin_update_closed_days" ON closed_days;
DROP POLICY IF EXISTS "admin_delete_closed_days" ON closed_days;

DROP TABLE IF EXISTS closed_days;
