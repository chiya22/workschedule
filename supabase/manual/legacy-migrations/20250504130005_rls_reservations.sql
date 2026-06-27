ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_store_reservations" ON reservations
  FOR SELECT
  USING (store_id IN (SELECT user_store_ids()));

CREATE POLICY "insert_own_store_reservations" ON reservations
  FOR INSERT
  WITH CHECK (store_id IN (SELECT user_store_ids()));

CREATE POLICY "update_own_store_reservations" ON reservations
  FOR UPDATE
  USING (store_id IN (SELECT user_store_ids()))
  WITH CHECK (store_id IN (SELECT user_store_ids()));

CREATE POLICY "delete_own_store_reservations" ON reservations
  FOR DELETE
  USING (is_store_owner(store_id));
