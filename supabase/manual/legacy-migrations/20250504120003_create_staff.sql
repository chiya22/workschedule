CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'staff');

CREATE TABLE staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        staff_role NOT NULL DEFAULT 'staff',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (store_id, user_id)
);

CREATE INDEX idx_staff_user_id ON staff(user_id);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
