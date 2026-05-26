-- ============================================================
-- ADD CODE_VERIFIED COLUMN TO PROFILES TABLE
-- ============================================================

-- Add code_verified column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'code_verified'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN code_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create index on code_verified for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_code_verified 
ON public.profiles(code_verified);

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Code verified column added successfully!';
END $$;
