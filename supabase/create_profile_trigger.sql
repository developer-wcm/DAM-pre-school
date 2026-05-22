-- ============================================================
-- AUTO-CREATE PROFILE WHEN USER SIGNS UP
-- ============================================================

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, school_id, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.raw_user_meta_data->>'school_id',
    false  -- New users need approval
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
