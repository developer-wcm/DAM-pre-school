-- Check which profiles still have DEM001
SELECT 
  id,
  email,
  full_name,
  role,
  school_id,
  created_at
FROM profiles
WHERE school_id = 'DEM001'
ORDER BY created_at DESC;

-- Force update ALL profiles to DEMO01 (including any stragglers)
UPDATE profiles
SET school_id = 'DEMO01'
WHERE school_id IN ('DEM001', 'SCHOOL123', 'SCHOOLID');

-- Also check and update the schools table if it exists
UPDATE schools
SET join_code = 'DEMO01'
WHERE join_code IN ('DEM001', 'SCHOOL123');

-- Final verification - should only show DEMO01 now
SELECT DISTINCT school_id, COUNT(*) as count
FROM profiles
GROUP BY school_id;

-- Verify everything matches
SELECT 
  'Profiles' as table_name,
  COUNT(DISTINCT school_id) as unique_school_ids,
  string_agg(DISTINCT school_id, ', ') as school_ids
FROM profiles
UNION ALL
SELECT 
  'Students' as table_name,
  COUNT(DISTINCT school_id),
  string_agg(DISTINCT school_id, ', ')
FROM students
UNION ALL
SELECT 
  'Fees' as table_name,
  COUNT(DISTINCT school_id),
  string_agg(DISTINCT school_id, ', ')
FROM fees;
