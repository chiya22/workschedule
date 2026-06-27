-- 単一店舗運用: stores テーブルと store_id 列を削除し、RLS をスタッフ単位に変更

-- --- 既存ポリシー削除 ---
DROP POLICY IF EXISTS "view_own_store_reservations" ON reservations;
DROP POLICY IF EXISTS "insert_own_store_reservations" ON reservations;
DROP POLICY IF EXISTS "update_own_store_reservations" ON reservations;
DROP POLICY IF EXISTS "delete_own_store_reservations" ON reservations;

DROP POLICY IF EXISTS "view_own_store_tables" ON tables;
DROP POLICY IF EXISTS "insert_tables_manager" ON tables;
DROP POLICY IF EXISTS "update_tables_manager" ON tables;
DROP POLICY IF EXISTS "delete_tables_owner" ON tables;

DROP POLICY IF EXISTS "view_staff_same_store" ON staff;
DROP POLICY IF EXISTS "insert_staff_owner" ON staff;
DROP POLICY IF EXISTS "update_staff_owner" ON staff;
DROP POLICY IF EXISTS "delete_staff_owner" ON staff;

DROP POLICY IF EXISTS "view_own_store_notifications" ON notifications;

DROP POLICY IF EXISTS "view_own_stores" ON stores;
DROP POLICY IF EXISTS "insert_stores_authenticated" ON stores;
DROP POLICY IF EXISTS "update_stores_owner" ON stores;
DROP POLICY IF EXISTS "delete_stores_owner" ON stores;

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;

DROP FUNCTION IF EXISTS user_store_ids();
DROP FUNCTION IF EXISTS is_store_owner(uuid);

DROP INDEX IF EXISTS idx_reservations_store_start;
ALTER TABLE reservations DROP COLUMN IF EXISTS store_id;

ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_store_id_name_key;
DROP INDEX IF EXISTS idx_tables_store_id;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_store_id_fkey;
ALTER TABLE tables DROP COLUMN IF EXISTS store_id;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_name_key;
ALTER TABLE tables ADD CONSTRAINT tables_name_key UNIQUE (name);

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_store_id_fkey;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_store_id_user_id_key;
ALTER TABLE staff DROP COLUMN IF EXISTS store_id;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_user_id_key;
ALTER TABLE staff ADD CONSTRAINT staff_user_id_key UNIQUE (user_id);

DROP TABLE IF EXISTS stores;

-- --- RLS: ログイン済みスタッフが予約を扱う（削除はオーナーのみ）---
CREATE POLICY "staff_select_reservations" ON reservations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid()));

CREATE POLICY "staff_insert_reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid()));

CREATE POLICY "staff_update_reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid()));

CREATE POLICY "owner_delete_reservations" ON reservations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.role = 'owner'));

-- --- tables ---
CREATE POLICY "staff_select_tables" ON tables
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid()));

CREATE POLICY "manager_insert_tables" ON tables
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "manager_update_tables" ON tables
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "owner_delete_tables" ON tables
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.role = 'owner'));

-- --- staff ---
CREATE POLICY "staff_select_staff" ON staff
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid()));

CREATE POLICY "owner_insert_staff" ON staff
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.role = 'owner'));

CREATE POLICY "owner_update_staff" ON staff
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.role = 'owner'));

CREATE POLICY "owner_delete_staff" ON staff
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.role = 'owner'));

-- --- notifications ---
CREATE POLICY "staff_select_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = notifications.reservation_id
        AND EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_reservations_start_at ON reservations (start_at);
