-- 予約管理 → 勤務管理への移行

-- 依存テーブルを先に削除
DROP TABLE IF EXISTS reservation_category_assignments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS reservation_categories CASCADE;
DROP TABLE IF EXISTS reservation_category_settings CASCADE;
DROP TABLE IF EXISTS tables CASCADE;

DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS reservation_seating_style CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Realtime から旧テーブルを外す（存在する場合）
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE reservations;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE reservation_category_assignments;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- 勤務ロール（シフト上の区分: メンバー / アルバイト）
CREATE TYPE shift_role AS ENUM ('member', 'part_time');

-- staff_role を admin / member / part_time に移行
CREATE TYPE staff_role_new AS ENUM ('admin', 'member', 'part_time');

ALTER TABLE staff ALTER COLUMN role DROP DEFAULT;

ALTER TABLE staff
  ALTER COLUMN role TYPE staff_role_new
  USING (
    CASE role::text
      WHEN 'owner' THEN 'admin'::staff_role_new
      WHEN 'manager' THEN 'admin'::staff_role_new
      WHEN 'staff' THEN 'member'::staff_role_new
      ELSE 'member'::staff_role_new
    END
  );

DROP TYPE staff_role;
ALTER TYPE staff_role_new RENAME TO staff_role;
ALTER TABLE staff ALTER COLUMN role SET DEFAULT 'member'::staff_role;

-- 勤務情報
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  role shift_role NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE INDEX idx_shifts_start_at ON shifts(start_at);
CREATE INDEX idx_shifts_end_at ON shifts(end_at);

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数を admin ベースに更新
CREATE OR REPLACE FUNCTION public.current_user_is_staff_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid() AND role = 'admin'::staff_role
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_staff_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_admin() TO service_role;

-- 旧 owner / owner_or_manager 関数は admin 判定に差し替え
CREATE OR REPLACE FUNCTION public.current_user_is_staff_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.current_user_is_staff_admin();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff_owner_or_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.current_user_is_staff_admin();
$$;

-- shifts RLS
CREATE POLICY "staff_select_shifts" ON shifts
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "admin_insert_shifts" ON shifts
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_admin());

CREATE POLICY "admin_update_shifts" ON shifts
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_admin())
  WITH CHECK (public.current_user_is_staff_admin());

CREATE POLICY "admin_delete_shifts" ON shifts
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_admin());

-- staff RLS（admin のみ書き込み）
DROP POLICY IF EXISTS "owner_insert_staff" ON staff;
DROP POLICY IF EXISTS "owner_update_staff" ON staff;
DROP POLICY IF EXISTS "owner_delete_staff" ON staff;

CREATE POLICY "admin_insert_staff" ON staff
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_admin());

CREATE POLICY "admin_update_staff" ON staff
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_admin())
  WITH CHECK (public.current_user_is_staff_admin());

CREATE POLICY "admin_delete_staff" ON staff
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_admin());

-- closed_days: 管理者のみメンテナンス
DROP POLICY IF EXISTS "owner_or_manager_insert_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_or_manager_update_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_or_manager_delete_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_insert_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_update_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_delete_closed_days" ON closed_days;

CREATE POLICY "admin_insert_closed_days" ON closed_days
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_admin());

CREATE POLICY "admin_update_closed_days" ON closed_days
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_admin())
  WITH CHECK (public.current_user_is_staff_admin());

CREATE POLICY "admin_delete_closed_days" ON closed_days
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
