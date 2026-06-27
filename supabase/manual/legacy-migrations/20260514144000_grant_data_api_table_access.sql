-- Supabase Data API requires explicit table grants for public schema tables.
-- RLS policies continue to decide which rows and operations each staff role can use.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE
    public.staff,
    public.tables,
    public.reservations,
    public.notifications,
    public.closed_days,
    public.reservation_categories
  TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE
    public.staff,
    public.tables,
    public.reservations,
    public.notifications,
    public.closed_days,
    public.reservation_categories
  TO service_role;
