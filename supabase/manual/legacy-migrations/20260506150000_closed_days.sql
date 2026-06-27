CREATE TABLE closed_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closed_on DATE NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE closed_days ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_closed_days_updated_at
  BEFORE UPDATE ON closed_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "staff_select_closed_days"
  ON closed_days
  FOR SELECT TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "owner_insert_closed_days"
  ON closed_days
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_staff_owner());

CREATE POLICY "owner_update_closed_days"
  ON closed_days
  FOR UPDATE TO authenticated
  USING (public.current_user_is_staff_owner())
  WITH CHECK (public.current_user_is_staff_owner());

CREATE POLICY "owner_delete_closed_days"
  ON closed_days
  FOR DELETE TO authenticated
  USING (public.current_user_is_staff_owner());
