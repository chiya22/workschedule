-- 立食/着席の既定値を立食に変更（既に 20260619120000 を適用済みの環境向け）
ALTER TABLE reservations
  ALTER COLUMN seating_style SET DEFAULT 'standing';
