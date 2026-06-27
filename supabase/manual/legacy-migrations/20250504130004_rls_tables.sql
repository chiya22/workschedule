ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_store_tables" ON tables
  FOR SELECT
  USING (store_id IN (SELECT user_store_ids()));

CREATE POLICY "insert_tables_manager" ON tables
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.store_id = store_id
        AND s.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "update_tables_manager" ON tables
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.store_id = tables.store_id
        AND s.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.store_id = tables.store_id
        AND s.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "delete_tables_owner" ON tables
  FOR DELETE
  USING (is_store_owner(store_id));
