-- ============================================================
-- ADD PARENT & TEACHER DEMO USERS ONLY
-- (Use this if you already have Admin & Principal)
-- ============================================================

-- PARENT
-- Email:    parent@dampreschool.com
-- Password: parent123
-- Code:     123456

-- TEACHER
-- Email:    teacher@dampreschool.com
-- Password: teacher123
-- Code:     654321

-- ============================================================
-- CREATE PARENT USER
-- ============================================================
DO $$
DECLARE
  parent_user_id uuid;
BEGIN
  -- Create auth user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'parent@dampreschool.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'parent@dampreschool.com',
      crypt('parent123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Parent"}',
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO parent_user_id;
  ELSE
    SELECT id INTO parent_user_id FROM auth.users WHERE email = 'parent@dampreschool.com';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, role, school_id, approved, verification_code, code_expires_at)
  VALUES (
    parent_user_id, 
    'Demo Parent', 
    'parent', 
    'DEMO01', 
    true,
    '123456',
    now() + interval '1 year'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Demo Parent', role = 'parent', school_id = 'DEMO01', approved = true,
      verification_code = '123456', code_expires_at = now() + interval '1 year';
END $$;

-- ============================================================
-- CREATE TEACHER USER
-- ============================================================
DO $$
DECLARE
  teacher_user_id uuid;
BEGIN
  -- Create auth user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@dampreschool.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'teacher@dampreschool.com',
      crypt('teacher123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Teacher"}',
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO teacher_user_id;
  ELSE
    SELECT id INTO teacher_user_id FROM auth.users WHERE email = 'teacher@dampreschool.com';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, role, school_id, approved, verification_code, code_expires_at)
  VALUES (
    teacher_user_id, 
    'Demo Teacher', 
    'teacher', 
    'DEMO01', 
    true,
    '654321',
    now() + interval '1 year'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Demo Teacher', role = 'teacher', school_id = 'DEMO01', approved = true,
      verification_code = '654321', code_expires_at = now() + interval '1 year';
END $$;
