ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_stores" ON stores
  FOR SELECT
  USING (id IN (SELECT user_store_ids()));

CREATE POLICY "insert_stores_authenticated" ON stores
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "update_stores_owner" ON stores
  FOR UPDATE
  USING (is_store_owner(id))
  WITH CHECK (is_store_owner(id));

CREATE POLICY "delete_stores_owner" ON stores
  FOR DELETE
  USING (is_store_owner(id));
