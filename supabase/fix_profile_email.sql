-- Fix profile trigger to include email on insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  school_id TEXT;
  verification_code TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');

  school_id := COALESCE(NEW.raw_user_meta_data->>'school_id', 'DEM001');

  IF user_role = 'teacher' THEN
    verification_code := '654321';
  ELSIF user_role = 'parent' THEN
    verification_code := '123456';
  ELSE
    verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, school_id, approved, verification_code, code_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    user_role,
    school_id,
    false,
    verification_code,
    now() + interval '1 year'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing profiles that have null email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;
