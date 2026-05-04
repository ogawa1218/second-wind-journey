-- =============================================================================
-- Second Wind Journey — anon/authenticated ロックダウン
-- 設計方針: 全アクセスは Server Actions / Route Handlers から service_role 経由のみ
-- 適用方法: Supabase MCP apply_migration、または supabase db push
-- =============================================================================
-- これは Supabase advisor が警告する以下を解消するための migration:
--   - 0011 function_search_path_mutable
--   - 0026 pg_graphql_anon_table_exposed
--   - 0027 pg_graphql_authenticated_table_exposed
--
-- 2nd-Brain の CLAUDE.md「2026-04-23 FC DB セキュリティ」決定と同じ運用ルール。

-- -----------------------------------------------------------------------------
-- 1. trigger_set_updated_at の search_path 固定（0011 解消）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. anon / authenticated への全権限 REVOKE（0026, 0027 解消）
-- -----------------------------------------------------------------------------
-- テーブル
REVOKE ALL ON TABLE users                    FROM anon, authenticated;
REVOKE ALL ON TABLE daily_records            FROM anon, authenticated;
REVOKE ALL ON TABLE runs                     FROM anon, authenticated;
REVOKE ALL ON TABLE vitality_score_snapshots FROM anon, authenticated;
REVOKE ALL ON TABLE checkup_results          FROM anon, authenticated;
REVOKE ALL ON TABLE ai_conversations         FROM anon, authenticated;
REVOKE ALL ON TABLE weekly_reviews           FROM anon, authenticated;

-- ビュー
REVOKE ALL ON v_user_age              FROM anon, authenticated;
REVOKE ALL ON v_monthly_ai_usage      FROM anon, authenticated;
REVOKE ALL ON v_latest_vitality_score FROM anon, authenticated;
REVOKE ALL ON v_weekly_run_stats      FROM anon, authenticated;
REVOKE ALL ON v_global_monthly_ai_cost FROM anon, authenticated;

-- ENUM 型（GRANT は不要だが念のため、デフォルトで PUBLIC に USAGE が付く）
REVOKE ALL ON TYPE gender_type     FROM anon, authenticated;
REVOKE ALL ON TYPE coach_tone_type FROM anon, authenticated;
REVOKE ALL ON TYPE run_source_type FROM anon, authenticated;
REVOKE ALL ON TYPE reliability_type FROM anon, authenticated;
REVOKE ALL ON TYPE ai_kind_type    FROM anon, authenticated;
REVOKE ALL ON TYPE ai_role_type    FROM anon, authenticated;

-- 将来追加されるテーブル/ビューにもデフォルトで anon/authenticated を付与しない
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
