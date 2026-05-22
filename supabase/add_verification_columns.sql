-- ============================================================
-- ADD VERIFICATION CODE COLUMNS TO PROFILES TABLE
-- ============================================================

-- Add verification_code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN verification_code TEXT;
  END IF;
END $$;

-- Add code_expires_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'code_expires_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN code_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index on verification_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_code 
ON public.profiles(verification_code);

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Verification code columns added successfully!';
END $$;
