CREATE TYPE reservation_category AS ENUM (
  'normal',
  'course',
  'private',
  'waitlist',
  'vip'
);

CREATE TYPE reservation_status AS ENUM (
  'confirmed',
  'pending',
  'cancelled',
  'no_show',
  'completed'
);

CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES tables(id) ON DELETE SET NULL,

  customer_name   TEXT NOT NULL,
  customer_phone  TEXT,
  party_size      INTEGER NOT NULL CHECK (party_size > 0),
  category        reservation_category NOT NULL DEFAULT 'normal',
  status          reservation_status NOT NULL DEFAULT 'confirmed',

  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,

  notes           TEXT,
  internal_notes  TEXT,

  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (end_at > start_at)
);

CREATE INDEX idx_reservations_store_start ON reservations(store_id, start_at);
CREATE INDEX idx_reservations_table_start ON reservations(table_id, start_at);
CREATE INDEX idx_reservations_status ON reservations(status);
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
