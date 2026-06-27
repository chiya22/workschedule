-- 予約金額カラムを追加するマイグレーション
-- 金額は「税込の日本円」を前提とした整数（円単位）で保存する。
-- 既存データには影響しないよう NULL 許可・既定値なしとする。

ALTER TABLE reservations
ADD COLUMN amount INTEGER CHECK (amount >= 0);

