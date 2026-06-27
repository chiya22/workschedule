CREATE TABLE stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  timezone    TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  open_time   TIME NOT NULL DEFAULT '11:00',
  close_time  TIME NOT NULL DEFAULT '22:00',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
