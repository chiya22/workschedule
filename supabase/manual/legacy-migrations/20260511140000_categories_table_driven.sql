-- 予約カテゴリを enum から reservation_categories に移し、コード追加・名前変更などをデータで管理できるようにする。
-- （予約済みがあるカテゴリは DELETE が FK で失敗する）

CREATE TABLE reservation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_]{0,39}$'),
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100,
  show_in_booking_form BOOLEAN NOT NULL DEFAULT true,
  blocks_entire_calendar BOOLEAN NOT NULL DEFAULT false,
  palette_key TEXT NOT NULL CHECK (
    palette_key IN ('normal', 'course', 'private', 'waitlist', 'vip')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reservation_categories_label_nonempty CHECK (
    LENGTH(TRIM(BOTH FROM label)) > 0
  )
);

CREATE TRIGGER update_reservation_categories_updated_at
  BEFORE UPDATE ON reservation_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO reservation_categories (
  code,
  label,
  sort_order,
  show_in_booking_form,
  blocks_entire_calendar,
  palette_key
)
VALUES
  ('normal', '通常', 10, TRUE, FALSE, 'normal'),
  ('course', 'コース', 20, TRUE, FALSE, 'course'),
  ('private', '貸し切り', 30, TRUE, TRUE, 'private'),
  ('waitlist', 'キャンセル待ち', 40, FALSE, FALSE, 'waitlist'),
  ('vip', 'VIP', 50, TRUE, FALSE, 'vip');

-- reservation_category_settings がある環境では表示名などを継承
UPDATE reservation_categories rc SET
  label = s.label,
  sort_order = s.sort_order,
  show_in_booking_form = s.show_in_booking_form
FROM reservation_category_settings s
WHERE rc.code = s.code::TEXT;

ALTER TABLE reservations ADD COLUMN category_id UUID REFERENCES reservation_categories (id);

UPDATE reservations AS r SET category_id = rc.id FROM reservation_categories AS rc WHERE r.category::TEXT = rc.code;

ALTER TABLE reservations ALTER COLUMN category_id SET NOT NULL;

DO $$
DECLARE normal_id UUID;
BEGIN
  SELECT id INTO normal_id FROM reservation_categories WHERE code = 'normal';
  EXECUTE format(
    'ALTER TABLE reservations ALTER COLUMN category_id SET DEFAULT %L::uuid',
    normal_id
  );
END $$;

ALTER TABLE reservations DROP COLUMN category;

DROP TABLE reservation_category_settings;

DROP TYPE reservation_category;

CREATE INDEX idx_reservations_category_id ON reservations (category_id);

ALTER TABLE reservation_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_reservation_categories"
  ON reservation_categories
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "owner_insert_reservation_categories"
  ON reservation_categories
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_owner());

CREATE POLICY "owner_update_reservation_categories"
  ON reservation_categories
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_owner())
  WITH CHECK (public.current_user_is_staff_owner());

CREATE POLICY "owner_delete_reservation_categories"
  ON reservation_categories
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_owner());
