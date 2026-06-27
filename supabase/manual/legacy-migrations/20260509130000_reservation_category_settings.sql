-- 予約カテゴリ（enum）ごとの表示名・並び順・予約フォームでの選択可否。
-- コード値自体は変更せず、マスタ側で運用調整できるようにする。

CREATE TABLE reservation_category_settings (
  code reservation_category PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order SMALLINT NOT NULL,
  show_in_booking_form BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_reservation_category_settings_updated_at
  BEFORE UPDATE ON reservation_category_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO reservation_category_settings (code, label, sort_order, show_in_booking_form)
VALUES
  ('normal', '通常', 10, true),
  ('course', 'コース', 20, true),
  ('private', '貸し切り', 30, true),
  ('waitlist', 'キャンセル待ち', 40, false),
  ('vip', 'VIP', 50, true);

ALTER TABLE reservation_category_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_reservation_category_settings"
  ON reservation_category_settings
  FOR SELECT
  TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "owner_update_reservation_category_settings"
  ON reservation_category_settings
  FOR UPDATE
  TO authenticated
  USING (public.current_user_is_staff_owner())
  WITH CHECK (public.current_user_is_staff_owner());
