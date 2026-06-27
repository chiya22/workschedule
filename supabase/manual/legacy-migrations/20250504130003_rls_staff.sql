ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_staff_same_store" ON staff
  FOR SELECT
  USING (store_id IN (SELECT user_store_ids()));

CREATE POLICY "insert_staff_owner" ON staff
  FOR INSERT
  WITH CHECK (is_store_owner(store_id));

CREATE POLICY "update_staff_owner" ON staff
  FOR UPDATE
  USING (is_store_owner(store_id))
  WITH CHECK (is_store_owner(store_id));

CREATE POLICY "delete_staff_owner" ON staff
  FOR DELETE
  USING (is_store_owner(store_id));
