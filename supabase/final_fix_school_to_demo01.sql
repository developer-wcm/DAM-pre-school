-- ============================================================
-- FINAL FIX: Convert everything to use DEMO01 as school_id
-- ============================================================

-- STEP 1: Check current state
SELECT 'BEFORE FIX - Schools' as status;
SELECT id, name, join_code, teacher_join_code FROM schools;

SELECT 'BEFORE FIX - Profiles' as status;
SELECT id, email, full_name, role, school_id, approved FROM profiles ORDER BY school_id, role;

-- STEP 2: Update or create the school with DEMO01 join_code
INSERT INTO schools (id, name, join_code, teacher_join_code)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'DAM PreSchool',
  'DEMO01',
  'TEACH01'
)
ON CONFLICT (join_code) 
DO UPDATE SET 
  name = 'DAM PreSchool',
  teacher_join_code = 'TEACH01';

-- STEP 3: Update all profiles to use DEMO01 (instead of DEM001)
UPDATE profiles
SET school_id = 'DEMO01'
WHERE school_id = 'DEM001' OR school_id IS NULL;

-- STEP 4: Sync profile emails from auth.users (so we can log in)
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- STEP 5: Delete the old DEM001 school if it exists
DELETE FROM schools WHERE join_code = 'DEM001';

-- STEP 6: Verify the fix
SELECT 'AFTER FIX - Schools' as status;
SELECT id, name, join_code, teacher_join_code FROM schools;

SELECT 'AFTER FIX - Profiles with emails' as status;
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.school_id,
  p.approved,
  CASE 
    WHEN p.email IS NOT NULL THEN '✓ CAN LOGIN'
    ELSE '✗ CANNOT LOGIN - NO EMAIL'
  END as login_status
FROM profiles p
WHERE p.role IN ('admin', 'principal', 'accountant')
ORDER BY p.email NULLS LAST, p.role;

-- STEP 7: Show working credentials
SELECT 'LOGIN CREDENTIALS' as info;
SELECT 
  u.email as login_email,
  p.full_name,
  p.role,
  'Use this email with password from demo scripts' as instruction
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.school_id = 'DEMO01'
  AND p.role IN ('admin', 'principal')
  AND u.email IS NOT NULL
ORDER BY p.role;
