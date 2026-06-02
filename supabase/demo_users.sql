-- ============================================================
-- DEMO USERS FOR TESTING
-- ============================================================

-- ADMIN
-- Email:    admin@dampreschool.com
-- Password: admin123
-- Role:     admin (no code required)

-- PRINCIPAL
-- Email:    principal@dampreschool.com
-- Password: principal123
-- Role:     principal (no code required)

-- PARENT
-- Email:    parent@dampreschool.com
-- Password: parent123
-- Code:     123456
-- Role:     parent

-- TEACHER
-- Email:    teacher@dampreschool.com
-- Password: teacher123
-- Code:     654321
-- Role:     teacher

-- ============================================================
-- CREATE DEMO SCHOOL
-- ============================================================
INSERT INTO public.schools (id, name, join_code, teacher_join_code)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'DAM PreSchool',
  'DEM001',
  'TEACH01'
)
ON CONFLICT (join_code) DO UPDATE 
SET name = 'DAM PreSchool', teacher_join_code = 'TEACH01';

-- ============================================================
-- CREATE ADMIN USER
-- ============================================================
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Create auth user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@dampreschool.com') THEN
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
      'admin@dampreschool.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Admin"}',
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO admin_user_id;
  ELSE
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@dampreschool.com';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, role, school_id, approved)
  VALUES (admin_user_id, 'Demo Admin', 'admin', 'DEM001', true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Demo Admin', role = 'admin', school_id = 'DEM001', approved = true;
END $$;

-- ============================================================
-- CREATE PRINCIPAL USER
-- ============================================================
DO $$
DECLARE
  principal_user_id uuid;
BEGIN
  -- Create auth user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'principal@dampreschool.com') THEN
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
      'principal@dampreschool.com',
      crypt('principal123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Principal"}',
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO principal_user_id;
  ELSE
    SELECT id INTO principal_user_id FROM auth.users WHERE email = 'principal@dampreschool.com';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, role, school_id, approved)
  VALUES (principal_user_id, 'Demo Principal', 'principal', 'DEM001', true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Demo Principal', role = 'principal', school_id = 'DEM001', approved = true;
END $$;

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
  SET full_name = 'Demo Parent', role = 'parent', school_id = 'DEM001', approved = true,
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
