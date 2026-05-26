-- ============================================================
-- AUTO-CREATE PROFILE WHEN USER SIGNS UP
-- ============================================================

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  school_id TEXT;
  verification_code TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
  
  -- Set school_id, default to DEMO01 if not provided
  school_id := COALESCE(NEW.raw_user_meta_data->>'school_id', 'DEMO01');
  
  -- Set verification code based on role
  IF user_role = 'teacher' THEN
    verification_code := '654321';
  ELSIF user_role = 'parent' THEN
    verification_code := '123456';
  ELSE
    verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;

  INSERT INTO public.profiles (id, full_name, role, school_id, approved, verification_code, code_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    user_role,
    school_id,
    false,  -- New users need approval
    verification_code,
    now() + interval '1 year'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Profile auto-creation trigger installed successfully!';
END $$;
