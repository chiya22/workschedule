-- 勤務管理アプリ 初期スキーマ（単一マイグレーション）
-- 対象テーブル: staff / shifts

CREATE TYPE staff_role AS ENUM ('admin', 'member', 'part_time');
CREATE TYPE shift_role AS ENUM ('member', 'part_time');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE staff (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_id           TEXT NOT NULL,
  name               TEXT NOT NULL,
  role               staff_role NOT NULL DEFAULT 'member',
  notification_email TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_user_id_key UNIQUE (user_id)
);

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE UNIQUE INDEX staff_login_id_lower_idx ON staff (lower(login_id));

COMMENT ON COLUMN staff.login_id IS
  'ログイン用アカウント名。Auth 上は @INTERNAL ドメインの擬似メールと対応。';
COMMENT ON COLUMN staff.notification_email IS
  '通知先メール（任意）。現行アプリでは未使用。';

CREATE TABLE shifts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name  TEXT NOT NULL,
  role        shift_role NOT NULL,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  created_by  UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shifts_end_after_start CHECK (end_at > start_at)
);

CREATE INDEX idx_shifts_start_at ON shifts(start_at);
CREATE INDEX idx_shifts_end_at ON shifts(end_at);

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff WHERE user_id = auth.uid()
  );
$$;

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

REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_staff_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_admin() TO service_role;

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_staff" ON staff
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

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

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

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

ALTER PUBLICATION supabase_realtime ADD TABLE shifts;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.staff, public.shifts
  TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.staff, public.shifts
  TO service_role;
