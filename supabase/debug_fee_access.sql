-- Check logged-in user's profile and school_id
SELECT 
  id as user_id,
  email,
  full_name,
  role,
  school_id as profile_school_id
FROM profiles
WHERE role IN ('admin', 'principal')
ORDER BY created_at DESC
LIMIT 5;

-- Check fees school_id
SELECT DISTINCT school_id as fees_school_id
FROM fees;

-- Check students school_id  
SELECT DISTINCT school_id as students_school_id
FROM students;

-- Check if there's a mismatch
SELECT 
  'Profile' as source,
  school_id
FROM profiles
WHERE role IN ('admin', 'principal')
UNION ALL
SELECT 
  'Fees' as source,
  school_id
FROM fees
UNION ALL
SELECT 
  'Students' as source,
  school_id
FROM students;
