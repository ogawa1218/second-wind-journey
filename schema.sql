-- =============================================================================
-- Second Wind Journey — Workers / LINE 拡張スキーマ
-- 既存: supabase/migrations/20260504000000_initial_schema.sql の上位に適用
-- テーブル: line_users, food_logs, penalty_contracts, penalty_pool_entries,
--           wearable_tokens, image_audit_log
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM 追加
-- -----------------------------------------------------------------------------
CREATE TYPE wearable_provider_type AS ENUM ('fitbit', 'garmin', 'google_fit');
CREATE TYPE penalty_status_type    AS ENUM ('pending', 'paid', 'distributed', 'refunded');
CREATE TYPE fraud_flag_type        AS ENUM (
  'duplicate_hash',
  'exif_timestamp_mismatch',
  'exif_location_mismatch',
  'rapid_resubmission',
  'ai_confidence_low'
);

-- -----------------------------------------------------------------------------
-- 1. line_users — LINE ユーザー ID ↔ app user ID マッピング
-- -----------------------------------------------------------------------------
CREATE TABLE line_users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES users(id) ON DELETE SET NULL,
  line_user_id    text        NOT NULL UNIQUE,
  display_name    text,
  picture_url     text,
  language        text        DEFAULT 'ja',
  linked_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_users_line_id ON line_users (line_user_id);
CREATE INDEX idx_line_users_user_id ON line_users (user_id);

ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_line_users"
  ON line_users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at_line_users
  BEFORE UPDATE ON line_users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. food_logs — 食事画像 + AI 解析済み PFC データ
-- -----------------------------------------------------------------------------
CREATE TABLE food_logs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at       timestamptz   NOT NULL DEFAULT now(),
  meal_type       text          CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  image_url       text,
  image_hash      text,
  calories_kcal   numeric(7,2)  CHECK (calories_kcal >= 0),
  protein_g       numeric(7,2)  CHECK (protein_g >= 0),
  fat_g           numeric(7,2)  CHECK (fat_g >= 0),
  carb_g          numeric(7,2)  CHECK (carb_g >= 0),
  fiber_g         numeric(7,2),
  food_name       text,
  ai_raw_response jsonb,
  ai_confidence   numeric(3,2)  CHECK (ai_confidence BETWEEN 0 AND 1),
  audit_passed    boolean       NOT NULL DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_logs_user_logged ON food_logs (user_id, logged_at DESC);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_food_logs"
  ON food_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3. penalty_contracts — ペナルティ誓約（入会時にユーザーが設定）
-- -----------------------------------------------------------------------------
CREATE TABLE penalty_contracts (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  weekly_target_runs    int           NOT NULL DEFAULT 3 CHECK (weekly_target_runs BETWEEN 1 AND 7),
  penalty_per_miss_jpy  int           NOT NULL DEFAULT 500 CHECK (penalty_per_miss_jpy BETWEEN 100 AND 10000),
  stripe_customer_id    text,
  stripe_payment_method text,
  active                boolean       NOT NULL DEFAULT true,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE penalty_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_penalty_contracts"
  ON penalty_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at_penalty_contracts
  BEFORE UPDATE ON penalty_contracts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. penalty_pool_entries — 週次ペナルティ決済レコード
-- -----------------------------------------------------------------------------
CREATE TABLE penalty_pool_entries (
  id                      uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date         date                NOT NULL,
  missed_runs             int                 NOT NULL DEFAULT 0,
  amount_charged_jpy      int                 NOT NULL DEFAULT 0,
  stripe_payment_intent   text,
  status                  penalty_status_type NOT NULL DEFAULT 'pending',
  distributed_at          timestamptz,
  created_at              timestamptz         NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_penalty_pool_week ON penalty_pool_entries (week_start_date, status);

ALTER TABLE penalty_pool_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_penalty_pool_entries"
  ON penalty_pool_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. wearable_tokens — Fitbit / Garmin OAuth トークン（暗号化推奨）
-- -----------------------------------------------------------------------------
CREATE TABLE wearable_tokens (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        wearable_provider_type  NOT NULL,
  access_token    text                    NOT NULL,
  refresh_token   text,
  expires_at      timestamptz,
  scope           text,
  external_user_id text,
  last_synced_at  timestamptz,
  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE wearable_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_wearable_tokens"
  ON wearable_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at_wearable_tokens
  BEFORE UPDATE ON wearable_tokens
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. image_audit_log — 画像不正提出（重複・メタデータ偽装）検知ログ
-- -----------------------------------------------------------------------------
CREATE TABLE image_audit_log (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_log_id     uuid              REFERENCES food_logs(id) ON DELETE SET NULL,
  image_hash      text              NOT NULL,
  fraud_flags     fraud_flag_type[] NOT NULL DEFAULT '{}',
  fraud_score     int               NOT NULL DEFAULT 0 CHECK (fraud_score BETWEEN 0 AND 100),
  exif_timestamp  timestamptz,
  claimed_at      timestamptz       NOT NULL DEFAULT now(),
  delta_minutes   int,
  duplicate_of    uuid              REFERENCES food_logs(id),
  reviewed        boolean           NOT NULL DEFAULT false,
  created_at      timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_image_audit_user     ON image_audit_log (user_id, created_at DESC);
CREATE INDEX idx_image_audit_hash     ON image_audit_log (image_hash);
CREATE INDEX idx_image_audit_fraud    ON image_audit_log (fraud_score DESC) WHERE fraud_score > 50;

ALTER TABLE image_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_image_audit_log"
  ON image_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- ビュー: v_weekly_discipline_score — 週次規律スコア（ランキング用）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_weekly_discipline_score
WITH (security_invoker = true)
AS
WITH week_runs AS (
  SELECT
    user_id,
    date_trunc('week', ran_at AT TIME ZONE 'Asia/Tokyo')::date AS week_start,
    COUNT(*)                                                     AS run_count,
    ROUND(SUM(distance_km), 2)                                   AS total_km
  FROM runs
  WHERE ran_at >= now() - INTERVAL '7 days'
  GROUP BY user_id, date_trunc('week', ran_at AT TIME ZONE 'Asia/Tokyo')
),
week_food AS (
  SELECT
    user_id,
    COUNT(*)                        AS log_count,
    ROUND(AVG(ai_confidence), 2)    AS avg_confidence,
    SUM(CASE WHEN audit_passed THEN 1 ELSE 0 END) AS clean_logs
  FROM food_logs
  WHERE logged_at >= now() - INTERVAL '7 days'
  GROUP BY user_id
),
week_sleep AS (
  SELECT
    user_id,
    ROUND(AVG(sleep_hours), 2) AS avg_sleep,
    ROUND(AVG(sleep_quality), 2) AS avg_quality
  FROM daily_records
  WHERE record_date >= (now() - INTERVAL '7 days')::date
  GROUP BY user_id
)
SELECT
  u.id               AS user_id,
  u.display_name,
  COALESCE(r.run_count, 0)                                      AS run_count,
  COALESCE(r.total_km, 0)                                       AS total_km,
  COALESCE(f.log_count, 0)                                      AS food_log_count,
  COALESCE(s.avg_sleep, 0)                                      AS avg_sleep_hours,
  -- 規律スコア (0-100): 睡眠30 + 食事30 + 運動40
  LEAST(100, GREATEST(0,
    ROUND(
      COALESCE(LEAST(s.avg_sleep / 8.0, 1.0) * 30, 0) +
      COALESCE(LEAST(f.log_count::numeric / 21.0, 1.0) * 30, 0) +
      COALESCE(LEAST(r.run_count::numeric / 3.0, 1.0) * 40, 0)
    )
  ))                                                             AS discipline_score
FROM users u
LEFT JOIN week_runs  r ON r.user_id = u.id
LEFT JOIN week_food  f ON f.user_id = u.id
LEFT JOIN week_sleep s ON s.user_id = u.id
ORDER BY discipline_score DESC;

COMMENT ON TABLE line_users           IS 'LINE UID ↔ app user ID マッピング。未登録ユーザーも格納。';
COMMENT ON TABLE food_logs            IS '食事画像ログ。AI 解析済み PFC・不正フラグ付き。';
COMMENT ON TABLE penalty_contracts    IS '週次ペナルティ誓約。Stripe 決済情報も保持。';
COMMENT ON TABLE penalty_pool_entries IS '週次ペナルティ決済履歴。プール額の配分追跡。';
COMMENT ON TABLE wearable_tokens      IS 'Fitbit/Garmin OAuth トークン。30 分ごとにサイレント同期。';
COMMENT ON TABLE image_audit_log      IS '画像不正検知ログ。重複ハッシュ・EXIF 偽装スコアリング。';
