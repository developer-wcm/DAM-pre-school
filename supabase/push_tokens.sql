-- Push notification tokens table
-- Run this in Supabase SQL editor to enable push notifications

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  role text,
  school_id text,
  platform text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own token
CREATE POLICY "users manage own push token"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);
