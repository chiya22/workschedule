-- ログインユーザーが所属する店舗 ID を返す
CREATE OR REPLACE FUNCTION user_store_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT store_id FROM staff WHERE user_id = auth.uid();
$$;

-- ログインユーザーが特定店舗のオーナーかチェック
CREATE OR REPLACE FUNCTION is_store_owner(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = auth.uid()
      AND store_id = target_store_id
      AND role = 'owner'
  );
$$;

GRANT EXECUTE ON FUNCTION user_store_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION is_store_owner(UUID) TO authenticated;
