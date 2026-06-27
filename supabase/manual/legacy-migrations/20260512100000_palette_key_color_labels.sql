-- palette_key を英語スラグから UI で使う「色」と同じ日本語値に統一する

DO $$
DECLARE
  con_rec RECORD;
BEGIN
  FOR con_rec IN
    SELECT pg_constraint.conname AS name
    FROM pg_constraint
    INNER JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_class.relname = 'reservation_categories'
      AND pg_namespace.nspname = 'public'
      AND pg_constraint.contype = 'c'
      AND pg_get_constraintdef(pg_constraint.oid) LIKE '%palette_key%'
  LOOP
    EXECUTE format(
      'ALTER TABLE reservation_categories DROP CONSTRAINT %I',
      con_rec.name
    );
  END LOOP;
END $$;

UPDATE reservation_categories
SET palette_key = CASE palette_key
  WHEN 'normal' THEN '青'
  WHEN 'course' THEN '緑'
  WHEN 'private' THEN 'アンバー'
  WHEN 'waitlist' THEN '赤'
  WHEN 'vip' THEN '紫'
  ELSE palette_key
END;

ALTER TABLE reservation_categories
  ADD CONSTRAINT reservation_categories_palette_key_check CHECK (
    palette_key IN ('青', '緑', 'アンバー', '赤', '紫')
  );
