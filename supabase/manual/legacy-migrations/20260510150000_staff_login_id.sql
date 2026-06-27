-- ログイン用アカウント名（メール不要運用）。Auth 上は @INTERNAL ドメインの擬似メールと対応させる。

ALTER TABLE staff ADD COLUMN IF NOT EXISTS login_id TEXT;

UPDATE staff
SET login_id = 'user_' || replace(id::text, '-', '')
WHERE login_id IS NULL OR btrim(login_id) = '';

ALTER TABLE staff ALTER COLUMN login_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS staff_login_id_lower_idx ON staff (lower(login_id));

-- スタッフ（auth ユーザー）削除時、作成者参照を残せるようにする
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_created_by_fkey;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL;
