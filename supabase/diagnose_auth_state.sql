-- ============================================================
-- DIAGNOSTIC: Check current authentication state
-- ============================================================

-- 1. Show all auth users (the actual login accounts)
SELECT 
  '1. AUTH USERS (can log in)' as section,
  email,
  created_at,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
ORDER BY created_at DESC;

-- 2. Show all profiles and whether they link to auth users
SELECT 
  '2. PROFILES' as section,
  p.id,
  p.email as profile_email,
  u.email as auth_email,
  p.full_name,
  p.role,
  p.school_id,
  p.approved,
  CASE 
    WHEN u.id IS NOT NULL THEN '✓ Linked to auth'
    ELSE '✗ No auth user'
  END as auth_link_status,
  CASE 
    WHEN u.email IS NOT NULL THEN '✓ Can login'
    ELSE '✗ Cannot login'
  END as login_status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.school_id, p.role;

-- 3. Show orphaned auth users (have login but no profile)
SELECT 
  '3. ORPHANED AUTH USERS (login without profile)' as section,
  u.email,
  u.created_at,
  'Create profile for this user' as action
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Show schools
SELECT 
  '4. SCHOOLS' as section,
  join_code,
  name,
  teacher_join_code
FROM schools
ORDER BY join_code;

-- 5. Count data by school
SELECT 
  '5. DATA COUNT BY SCHOOL' as section,
  school_id,
  COUNT(*) as profile_count
FROM profiles
GROUP BY school_id
ORDER BY school_id;

SELECT 
  '5b. STUDENTS BY SCHOOL' as section,
  school_id,
  COUNT(*) as student_count
FROM students
GROUP BY school_id
ORDER BY school_id;

SELECT 
  '5c. FEES BY SCHOOL' as section,
  school_id,
  COUNT(*) as fee_count
FROM fees
GROUP BY school_id
ORDER BY school_id;

-- 6. Show which accounts can access DEMO01 data
SELECT 
  '6. ACCOUNTS WITH DEMO01 ACCESS' as section,
  u.email as login_email,
  p.full_name,
  p.role,
  p.approved,
  CASE 
    WHEN p.approved = true THEN '✓ READY TO USE'
    ELSE '✗ NOT APPROVED'
  END as account_status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.school_id = 'DEMO01'
ORDER BY p.role, u.email;
