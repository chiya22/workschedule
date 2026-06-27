CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'line');
CREATE TYPE notification_type AS ENUM ('confirmation', 'reminder', 'cancellation');

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  channel         notification_channel NOT NULL,
  type            notification_type NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL,
  error_message   TEXT
);

CREATE INDEX idx_notifications_reservation ON notifications(reservation_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
