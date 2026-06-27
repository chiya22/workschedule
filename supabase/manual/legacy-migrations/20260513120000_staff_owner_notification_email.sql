-- オーナー向け予約通知メールの送信先（実メールアドレス）。オーナー role ではアプリ側で必須。

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS notification_email TEXT;

COMMENT ON COLUMN staff.notification_email IS
  'オーナーの通知先メール。オーナーでは必須。マネージャー・スタッフは NULL。';
