-- ============================================================
-- COMPLETE SETUP SCRIPT - Run this once in Supabase
-- This script sets up everything needed for the demo users
-- ============================================================

-- STEP 1: Add verification code columns (if not exists)
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

-- STEP 2: Create demo school (if not exists)
INSERT INTO public.schools (id, name, join_code, teacher_join_code)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'DAM PreSchool',
  'DEMO01',
  'TEACH01'
)
ON CONFLICT (join_code) DO UPDATE 
SET name = 'DAM PreSchool', teacher_join_code = 'TEACH01';

-- STEP 3: Create ADMIN user
DO $$
DECLARE admin_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@dampreschool.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
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
      now(), now()
    )
    RETURNING id INTO admin_user_id;
  ELSE
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@dampreschool.com';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, school_id, approved)
  VALUES (admin_user_id, 'Demo Admin', 'admin', 'DEMO01', true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Demo Admin', role = 'admin', school_id = 'DEMO01', approved = true;
END $$;

-- STEP 4: Create PRINCIPAL user
DO $$
DECLARE principal_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'principal@dampreschool.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
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
      now(), now()
    )
    RETURNING id INTO principal_user_id;
  ELSE
    SELECT id INTO principal_user_id FROM auth.users WHERE email = 'principal@dampreschool.com';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, school_id, approved)
  VALUES (principal_user_id, 'Demo Principal', 'principal', 'DEMO01', true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Demo Principal', role = 'principal', school_id = 'DEMO01', approved = true;
END $$;

-- STEP 5: Create PARENT user with verification code 123456
DO $$
DECLARE parent_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'parent@dampreschool.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
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
      now(), now()
    )
    RETURNING id INTO parent_user_id;
  ELSE
    SELECT id INTO parent_user_id FROM auth.users WHERE email = 'parent@dampreschool.com';
  END IF;

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

-- STEP 6: Create TEACHER user with verification code 654321
DO $$
DECLARE teacher_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@dampreschool.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
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
      now(), now()
    )
    RETURNING id INTO teacher_user_id;
  ELSE
    SELECT id INTO teacher_user_id FROM auth.users WHERE email = 'teacher@dampreschool.com';
  END IF;

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

-- STEP 7: Verify all users
SELECT 
  u.email, 
  p.full_name, 
  p.role, 
  p.approved,
  p.verification_code,
  p.code_expires_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN (
  'admin@dampreschool.com',
  'principal@dampreschool.com', 
  'parent@dampreschool.com',
  'teacher@dampreschool.com'
)
ORDER BY p.role;