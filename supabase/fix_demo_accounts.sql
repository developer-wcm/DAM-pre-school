-- Fix demo accounts by checking auth.users and updating profiles
-- Step 1: Check what auth users exist
SELECT 
  'Auth Users' as source,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check current profiles and their connection to auth
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.school_id,
  p.approved,
  CASE 
    WHEN u.id IS NOT NULL THEN '✓ Has auth user'
    ELSE '✗ No auth user'
  END as auth_status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.school_id = 'DEMO01'
ORDER BY p.created_at DESC;

-- Step 3: Find any orphaned auth users (have auth but no profile)
SELECT 
  u.id,
  u.email,
  u.created_at,
  '✗ No profile' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Step 4: Update profiles to match their auth users' emails
UPDATE profiles
SET email = u.email
FROM auth.users u
WHERE profiles.id = u.id
  AND profiles.school_id = 'DEMO01'
  AND profiles.email IS NULL;

-- Step 5: Verify the fix
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.school_id,
  CASE 
    WHEN p.email IS NOT NULL THEN '✓ CAN LOGIN'
    ELSE '✗ CANNOT LOGIN'
  END as login_status
FROM profiles p
WHERE p.school_id = 'DEMO01'
  AND p.role IN ('admin', 'principal')
ORDER BY p.email NULLS LAST;
