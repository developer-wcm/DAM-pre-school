-- Add extended info columns to students table
-- Run this once in your Supabase SQL editor

ALTER TABLE students
  -- Personal details
  ADD COLUMN IF NOT EXISTS mother_tongue        TEXT,
  ADD COLUMN IF NOT EXISTS nationality          TEXT DEFAULT 'Indian',
  ADD COLUMN IF NOT EXISTS aadhaar_last4        TEXT,
  ADD COLUMN IF NOT EXISTS address              TEXT,

  -- Father's details
  ADD COLUMN IF NOT EXISTS father_name          TEXT,
  ADD COLUMN IF NOT EXISTS father_phone         TEXT,
  ADD COLUMN IF NOT EXISTS father_email         TEXT,
  ADD COLUMN IF NOT EXISTS father_occupation    TEXT,
  ADD COLUMN IF NOT EXISTS father_work_location TEXT,

  -- Mother's details
  ADD COLUMN IF NOT EXISTS mother_name          TEXT,
  ADD COLUMN IF NOT EXISTS mother_phone         TEXT,
  ADD COLUMN IF NOT EXISTS mother_email         TEXT,
  ADD COLUMN IF NOT EXISTS mother_occupation    TEXT,
  ADD COLUMN IF NOT EXISTS mother_work_location TEXT,

  -- Guardian details (optional)
  ADD COLUMN IF NOT EXISTS guardian_name        TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone       TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relation    TEXT;
