-- Fix approval RPC for profiles table
-- Run this in the Supabase SQL editor if approvals fail with:
-- column "updated_at" of relation "profiles" does not exist

CREATE OR REPLACE FUNCTION approve_profile(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET approved = TRUE
  WHERE id = p_user_id;
END;
$$;
