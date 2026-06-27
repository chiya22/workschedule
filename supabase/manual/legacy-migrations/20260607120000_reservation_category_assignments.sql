-- 1 予約に複数カテゴリ（例: メイン・ロビー・デッキ）を紐付け可能にする。
-- reservations.category_id は表示色・互換用の代表カテゴリ（sort_order 最小）。

CREATE TABLE reservation_category_assignments (
  reservation_id UUID NOT NULL REFERENCES reservations (id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES reservation_categories (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reservation_id, category_id)
);

CREATE INDEX idx_reservation_category_assignments_category
  ON reservation_category_assignments (category_id);

INSERT INTO reservation_category_assignments (reservation_id, category_id)
SELECT id, category_id
FROM reservations;

ALTER TABLE reservation_category_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_reservation_category_assignments"
  ON reservation_category_assignments
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "staff_insert_reservation_category_assignments"
  ON reservation_category_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff());

CREATE POLICY "staff_delete_reservation_category_assignments"
  ON reservation_category_assignments
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff());
