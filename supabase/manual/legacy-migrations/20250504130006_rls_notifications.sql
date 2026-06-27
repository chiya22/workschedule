ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_store_notifications" ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = notifications.reservation_id
        AND r.store_id IN (SELECT user_store_ids())
    )
  );

CREATE POLICY "insert_notifications_service_role" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "update_notifications_service_role" ON notifications
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
