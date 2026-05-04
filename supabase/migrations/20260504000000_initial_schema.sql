-- =============================================================================
-- Second Wind Journey — 初期スキーマ
-- PostgreSQL 17 / Supabase (ai-health-os, qkixjendrotfbabikxzf, Tokyo)
-- 作成日: 2026-05-04
-- 適用方法: Supabase MCP apply_migration、または supabase db push
-- 仕様書: 01_Projects/Second_Wind_Journey/Specs/db-schema-v1.2.md (2nd-Brain repo)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. 前提拡張
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. ENUM 型定義
-- -----------------------------------------------------------------------------
CREATE TYPE gender_type     AS ENUM ('male', 'female', 'other');
CREATE TYPE coach_tone_type AS ENUM ('coach', 'spartan', 'supporter');
CREATE TYPE run_source_type AS ENUM ('garmin', 'strava', 'manual');
CREATE TYPE reliability_type AS ENUM ('low', 'medium', 'high');
CREATE TYPE ai_kind_type    AS ENUM ('daily_action', 'chat', 'weekly_review', 'crisis_response');
CREATE TYPE ai_role_type    AS ENUM ('user', 'assistant', 'system');

-- -----------------------------------------------------------------------------
-- 2. updated_at 自動更新トリガー関数（全テーブル共通）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. users — ユーザープロフィール（auth.users と 1:1 紐付け）
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id                              uuid        PRIMARY KEY
                                              REFERENCES auth.users(id) ON DELETE CASCADE,
  email                           text        NOT NULL UNIQUE,
  display_name                    text,
  gender                          gender_type,
  birth_date                      date,
  height_cm                       numeric(5,2)
                                              CHECK (height_cm > 0 AND height_cm <= 300),
  target_full_marathon_seconds    int
                                              CHECK (target_full_marathon_seconds > 0),
  coach_tone                      coach_tone_type NOT NULL DEFAULT 'coach',
  crisis_detected_at              timestamptz,
  onboarding_completed_at         timestamptz,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_users"
  ON users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. daily_records
-- -----------------------------------------------------------------------------
CREATE TABLE daily_records (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_date         date        NOT NULL,
  weight_kg           numeric(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500),
  sleep_hours         numeric(4,2) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality       smallint     CHECK (sleep_quality BETWEEN 1 AND 5),
  mood                smallint     CHECK (mood BETWEEN 1 AND 5),
  body_fat_percent    numeric(5,2) CHECK (body_fat_percent > 0 AND body_fat_percent < 100),
  resting_heart_rate  int          CHECK (resting_heart_rate > 0 AND resting_heart_rate <= 300),
  note                text,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_date)
);

CREATE INDEX idx_daily_records_user_date
  ON daily_records (user_id, record_date DESC);

ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_daily_records"
  ON daily_records FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. runs
-- -----------------------------------------------------------------------------
CREATE TABLE runs (
  id                        uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ran_at                    timestamptz  NOT NULL,
  distance_km               numeric(8,3) NOT NULL CHECK (distance_km > 0),
  duration_seconds          int          NOT NULL CHECK (duration_seconds > 0),
  avg_pace_seconds_per_km   int          GENERATED ALWAYS AS (
                                           CASE
                                             WHEN distance_km > 0
                                             THEN ROUND(duration_seconds::numeric / distance_km)::int
                                             ELSE NULL
                                           END
                                         ) STORED,
  avg_heart_rate            int          CHECK (avg_heart_rate > 0 AND avg_heart_rate <= 300),
  elevation_gain_m          numeric(8,2),
  source                    run_source_type NOT NULL DEFAULT 'manual',
  external_id               text,
  raw_data                  jsonb,
  created_at                timestamptz  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_runs_dedup_external
  ON runs (user_id, source, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX idx_runs_user_ran_at
  ON runs (user_id, ran_at DESC);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_runs"
  ON runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. vitality_score_snapshots
-- -----------------------------------------------------------------------------
CREATE TABLE vitality_score_snapshots (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date       date              NOT NULL,
  vitality_score      numeric(6,2)      NOT NULL CHECK (vitality_score BETWEEN 20 AND 100),
  chronological_age   numeric(5,2)      NOT NULL,
  diff                numeric(6,2)      NOT NULL,
  clipped             boolean           NOT NULL DEFAULT false,
  layer1_score        numeric(6,2)      NOT NULL,
  layer2_score        numeric(6,2),
  breakdown           jsonb             NOT NULL,
  reliability         reliability_type  NOT NULL,
  created_at          timestamptz       NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date)
);

CREATE INDEX idx_vitality_score_user_date
  ON vitality_score_snapshots (user_id, snapshot_date DESC);

ALTER TABLE vitality_score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_vitality_score_snapshots"
  ON vitality_score_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7. checkup_results
-- -----------------------------------------------------------------------------
CREATE TABLE checkup_results (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  examined_on     date         NOT NULL,
  hba1c           numeric(5,2) CHECK (hba1c BETWEEN 3 AND 20),
  ldl             numeric(6,2) CHECK (ldl BETWEEN 20 AND 500),
  hdl             numeric(6,2) CHECK (hdl BETWEEN 10 AND 200),
  triglyceride    numeric(7,2) CHECK (triglyceride BETWEEN 10 AND 5000),
  systolic_bp     int          CHECK (systolic_bp BETWEEN 60 AND 250),
  diastolic_bp    int          CHECK (diastolic_bp BETWEEN 40 AND 200),
  raw_pdf_url     text,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkup_results_user_date
  ON checkup_results (user_id, examined_on DESC);

ALTER TABLE checkup_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_checkup_results"
  ON checkup_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8. ai_conversations (ai_usage_log 統合)
-- -----------------------------------------------------------------------------
CREATE TABLE ai_conversations (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            ai_kind_type  NOT NULL,
  role            ai_role_type  NOT NULL,
  content         text          NOT NULL,
  context_data    jsonb,
  model           text,
  input_tokens    int           CHECK (input_tokens >= 0),
  output_tokens   int           CHECK (output_tokens >= 0),
  cost_usd        numeric(10,6) CHECK (cost_usd >= 0),
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user_created
  ON ai_conversations (user_id, created_at DESC);

CREATE INDEX idx_ai_conversations_user_kind_created
  ON ai_conversations (user_id, kind, created_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_ai_conversations"
  ON ai_conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 9. weekly_reviews
-- -----------------------------------------------------------------------------
CREATE TABLE weekly_reviews (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date   date        NOT NULL,
  markdown_content  text        NOT NULL,
  stats             jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_weekly_reviews_user_week
  ON weekly_reviews (user_id, week_start_date DESC);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_weekly_reviews"
  ON weekly_reviews FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================================================
-- ビュー定義
-- =============================================================================

-- V1. v_user_age — birth_date から age を計算
CREATE OR REPLACE VIEW v_user_age
WITH (security_invoker = true)
AS
SELECT
  id,
  email,
  display_name,
  gender,
  birth_date,
  height_cm,
  EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::int  AS age_years,
  ROUND((CURRENT_DATE - birth_date)::numeric / 365.25, 2) AS age_decimal,
  target_full_marathon_seconds,
  coach_tone,
  crisis_detected_at,
  onboarding_completed_at,
  created_at,
  updated_at
FROM users;

-- V2. v_monthly_ai_usage — ユーザー別月次AIコスト
CREATE OR REPLACE VIEW v_monthly_ai_usage
WITH (security_invoker = true)
AS
SELECT
  user_id,
  date_trunc('month', created_at AT TIME ZONE 'UTC')::date AS month,
  COUNT(*)                                                  AS request_count,
  SUM(input_tokens)                                         AS total_input_tokens,
  SUM(output_tokens)                                        AS total_output_tokens,
  SUM(input_tokens + COALESCE(output_tokens, 0))            AS total_tokens,
  ROUND(SUM(cost_usd), 6)                                   AS total_cost_usd,
  ROUND(SUM(cost_usd) / 1.5 * 100, 1)                       AS budget_usage_pct
FROM ai_conversations
WHERE cost_usd IS NOT NULL
GROUP BY user_id, date_trunc('month', created_at AT TIME ZONE 'UTC')
ORDER BY month DESC, total_cost_usd DESC;

-- V3. v_latest_vitality_score — 最新スコア + 前回比
CREATE OR REPLACE VIEW v_latest_vitality_score
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (s.user_id)
  s.user_id,
  s.snapshot_date,
  s.vitality_score,
  s.chronological_age,
  s.diff,
  s.clipped,
  s.layer1_score,
  s.layer2_score,
  s.breakdown,
  s.reliability,
  LAG(s.vitality_score) OVER (
    PARTITION BY s.user_id ORDER BY s.snapshot_date
  ) AS prev_vitality_score,
  s.vitality_score - LAG(s.vitality_score) OVER (
    PARTITION BY s.user_id ORDER BY s.snapshot_date
  ) AS score_delta
FROM vitality_score_snapshots s
ORDER BY s.user_id, s.snapshot_date DESC;

-- V4. v_weekly_run_stats — 直近7日間のラン集計
CREATE OR REPLACE VIEW v_weekly_run_stats
WITH (security_invoker = true)
AS
SELECT
  user_id,
  COUNT(*)                                  AS run_count,
  ROUND(SUM(distance_km), 2)                AS total_distance_km,
  SUM(duration_seconds)                     AS total_duration_seconds,
  ROUND(
    SUM(
      CASE
        WHEN avg_pace_seconds_per_km IS NULL THEN 0
        WHEN avg_pace_seconds_per_km <= 257  THEN (duration_seconds::numeric / 60) * 14
        WHEN avg_pace_seconds_per_km <= 300  THEN (duration_seconds::numeric / 60) * 12
        WHEN avg_pace_seconds_per_km <= 360  THEN (duration_seconds::numeric / 60) * 10
        WHEN avg_pace_seconds_per_km <= 420  THEN (duration_seconds::numeric / 60) * 8
        ELSE                                      (duration_seconds::numeric / 60) * 7
      END
    )
  )                                         AS weekly_met_minutes,
  MIN(avg_pace_seconds_per_km)              AS best_pace_seconds_per_km,
  ROUND(AVG(avg_pace_seconds_per_km))::int  AS avg_pace_seconds_per_km,
  MAX(ran_at)                               AS last_ran_at,
  COUNT(DISTINCT ran_at::date)              AS run_days
FROM runs
WHERE ran_at >= now() - INTERVAL '7 days'
GROUP BY user_id;

-- V5. v_global_monthly_ai_cost — 全体月次コスト（$200 上限監視）
CREATE OR REPLACE VIEW v_global_monthly_ai_cost
WITH (security_invoker = true)
AS
SELECT
  date_trunc('month', created_at AT TIME ZONE 'UTC')::date AS month,
  COUNT(DISTINCT user_id)                                   AS active_users,
  COUNT(*)                                                  AS total_requests,
  ROUND(SUM(cost_usd), 4)                                   AS total_cost_usd,
  ROUND(SUM(cost_usd) / 200 * 100, 1)                       AS global_budget_pct
FROM ai_conversations
WHERE cost_usd IS NOT NULL
GROUP BY date_trunc('month', created_at AT TIME ZONE 'UTC')
ORDER BY month DESC;

-- =============================================================================
-- COMMENT
-- =============================================================================
COMMENT ON TABLE users                    IS 'ユーザープロフィール。auth.users と 1:1 紐付け。';
COMMENT ON TABLE daily_records            IS '日次の体重・睡眠・気分。1ユーザー1日1レコード。';
COMMENT ON TABLE runs                     IS 'ラン履歴。Garmin/Strava 同期 + 手動入力対応。';
COMMENT ON TABLE vitality_score_snapshots IS 'Vitality Score の日次スナップショット。';
COMMENT ON TABLE checkup_results          IS '年次健診データ。Layer 2 スコア算出に使用。';
COMMENT ON TABLE ai_conversations         IS 'AIコーチの会話履歴 + トークン/コスト記録（ai_usage_log 統合）。';
COMMENT ON TABLE weekly_reviews           IS '週次レビューの Markdown ドラフト。';

COMMENT ON COLUMN runs.avg_pace_seconds_per_km IS 'GENERATED STORED: duration_seconds / distance_km の自動計算値。';
COMMENT ON COLUMN ai_conversations.cost_usd    IS 'claude-sonnet-4-7 換算: input $3/MTok + output $15/MTok。';
COMMENT ON COLUMN users.crisis_detected_at     IS '希死念慮検知時にセット。NULL 以外はコーチ機能をロック。';
