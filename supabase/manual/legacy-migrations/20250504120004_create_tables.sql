CREATE TABLE tables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  capacity      INTEGER NOT NULL,
  is_private    BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (store_id, name)
);

CREATE INDEX idx_tables_store_id ON tables(store_id);
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
