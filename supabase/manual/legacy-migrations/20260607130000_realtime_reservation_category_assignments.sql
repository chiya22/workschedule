-- reservation_category_assignments を Realtime publication に追加（冪等）

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reservation_category_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_category_assignments;
  END IF;
END $$;
