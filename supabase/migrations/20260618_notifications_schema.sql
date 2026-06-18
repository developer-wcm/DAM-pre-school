-- =============================================================
-- DAM PreSchool – Notification System Schema
-- Run this migration in Supabase SQL Editor or via CLI
-- =============================================================

-- =============================================================
-- 1. PUSH TOKENS – add missing columns (safe / idempotent)
-- =============================================================
ALTER TABLE push_tokens
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS device_name TEXT;

-- Ensure the token column is indexed for lookup by token value
CREATE INDEX IF NOT EXISTS idx_push_tokens_token       ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id     ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_role        ON push_tokens(role);
CREATE INDEX IF NOT EXISTS idx_push_tokens_school_id   ON push_tokens(school_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active      ON push_tokens(is_active) WHERE is_active = TRUE;

-- RLS: users can read/write their own token rows
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "push_tokens_user_all" ON push_tokens
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 2. NOTIFICATIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id        TEXT        NOT NULL DEFAULT '',
  title            TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  -- Granular category drives icon, color, and deep-link destination
  category         TEXT        NOT NULL,
  -- Arbitrary JSON payload forwarded to the notification tap handler
  data             JSONB       NOT NULL DEFAULT '{}',
  is_read          BOOLEAN     NOT NULL DEFAULT FALSE,
  is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at          TIMESTAMPTZ,
  -- Per-user deduplication: same (user_id, idempotency_key) is silently dropped
  idempotency_key  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-user uniqueness on idempotency key (NULL values are always distinct – OK)
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_user_idempotency
  ON notifications(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, is_read, is_deleted);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_school  ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_cat     ON notifications(category);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Edge functions run with service-role key which bypasses RLS.
-- This policy is for callers that don't use service-role.
DO $$ BEGIN
  CREATE POLICY "notifications_insert_authenticated" ON notifications
    FOR INSERT WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 3. NOTIFICATION DELIVERY LOG (retry tracking)
-- =============================================================
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id  UUID        REFERENCES notifications(id) ON DELETE CASCADE,
  -- Raw Expo push token – kept even if push_tokens row is deleted
  push_token       TEXT        NOT NULL,
  -- Ticket ID returned by Expo after a successful HTTP 200
  expo_ticket_id   TEXT,
  -- pending | sent | delivered | failed | error
  status           TEXT        NOT NULL DEFAULT 'pending',
  error_message    TEXT,
  attempt_count    INT         NOT NULL DEFAULT 1,
  last_attempt_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_notification  ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status        ON notification_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_delivery_failed        ON notification_delivery_log(status, attempt_count)
  WHERE status IN ('failed', 'error');

-- Service role handles inserts; users have no access to this table
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "delivery_log_no_user_access" ON notification_delivery_log
    FOR ALL USING (FALSE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 4. HELPFUL VIEWS
-- =============================================================

-- Quick unread-count view (for reporting / admin queries)
CREATE OR REPLACE VIEW notification_unread_counts AS
  SELECT user_id, COUNT(*) AS unread_count
  FROM notifications
  WHERE is_read = FALSE AND is_deleted = FALSE
  GROUP BY user_id;
