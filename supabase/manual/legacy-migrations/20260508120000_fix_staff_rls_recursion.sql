-- staff のポリシーで「staff 自身を EXISTS サブクエリ」すると SELECT のたびに同じポリシーが再評価され 42P17 無限再帰になる。
-- SECURITY DEFINER で RLS をバイパスして判定する関数に置き換える。

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

CREATE OR REPLACE FUNCTION public.current_user_is_staff_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid() AND role = 'owner'::staff_role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff_owner_or_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid()
      AND role IN ('owner'::staff_role, 'manager'::staff_role)
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_staff_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_staff_owner_or_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_owner() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_owner_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff_owner_or_manager() TO service_role;

-- --- reservations ---
DROP POLICY IF EXISTS "staff_select_reservations" ON reservations;
DROP POLICY IF EXISTS "staff_insert_reservations" ON reservations;
DROP POLICY IF EXISTS "staff_update_reservations" ON reservations;
DROP POLICY IF EXISTS "owner_delete_reservations" ON reservations;

CREATE POLICY "staff_select_reservations" ON reservations
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "staff_insert_reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff());

CREATE POLICY "staff_update_reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff())
  WITH CHECK (public.current_user_is_staff());

CREATE POLICY "owner_delete_reservations" ON reservations
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_owner());

-- --- tables ---
DROP POLICY IF EXISTS "staff_select_tables" ON tables;
DROP POLICY IF EXISTS "manager_insert_tables" ON tables;
DROP POLICY IF EXISTS "manager_update_tables" ON tables;
DROP POLICY IF EXISTS "owner_delete_tables" ON tables;

CREATE POLICY "staff_select_tables" ON tables
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "manager_insert_tables" ON tables
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_owner_or_manager());

CREATE POLICY "manager_update_tables" ON tables
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_owner_or_manager())
  WITH CHECK (public.current_user_is_staff_owner_or_manager());

CREATE POLICY "owner_delete_tables" ON tables
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_owner());

-- --- staff ---
DROP POLICY IF EXISTS "staff_select_staff" ON staff;
DROP POLICY IF EXISTS "owner_insert_staff" ON staff;
DROP POLICY IF EXISTS "owner_update_staff" ON staff;
DROP POLICY IF EXISTS "owner_delete_staff" ON staff;

CREATE POLICY "staff_select_staff" ON staff
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "owner_insert_staff" ON staff
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_owner());

CREATE POLICY "owner_update_staff" ON staff
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_owner())
  WITH CHECK (public.current_user_is_staff_owner());

CREATE POLICY "owner_delete_staff" ON staff
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_owner());

-- --- notifications ---
DROP POLICY IF EXISTS "staff_select_notifications" ON notifications;

CREATE POLICY "staff_select_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = notifications.reservation_id
        AND public.current_user_is_staff()
    )
  );
