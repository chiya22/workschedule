DROP POLICY IF EXISTS "owner_insert_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_update_closed_days" ON closed_days;
DROP POLICY IF EXISTS "owner_delete_closed_days" ON closed_days;

CREATE POLICY "owner_or_manager_insert_closed_days"
  ON closed_days
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_owner_or_manager());

CREATE POLICY "owner_or_manager_update_closed_days"
  ON closed_days
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_owner_or_manager())
  WITH CHECK (public.current_user_is_staff_owner_or_manager());

CREATE POLICY "owner_or_manager_delete_closed_days"
  ON closed_days
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_owner_or_manager());
