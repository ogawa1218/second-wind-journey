-- =============================================================================
-- handle_new_auth_user() のトリガー外実行を禁止
-- advisor 0028 / 0029 解消（anon / authenticated が REST 経由で呼べる問題）
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated, public;
