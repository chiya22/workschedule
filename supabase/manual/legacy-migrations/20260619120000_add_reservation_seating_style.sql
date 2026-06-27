-- 予約の立食/着席スタイル
CREATE TYPE reservation_seating_style AS ENUM ('standing', 'seated');

ALTER TABLE reservations
  ADD COLUMN seating_style reservation_seating_style NOT NULL DEFAULT 'standing';
