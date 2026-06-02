-- Update all profiles with DEM001 to DEMO01 (to match students and fees)
UPDATE profiles
SET school_id = 'DEMO01'
WHERE school_id = 'DEM001';

-- Verify the fix
SELECT 
  full_name,
  email,
  role,
  school_id,
  'Updated' as status
FROM profiles
WHERE role IN ('admin', 'principal')
ORDER BY created_at DESC;

-- Check everything now has DEMO01
SELECT DISTINCT 
  'After Fix' as status,
  source,
  school_id
FROM (
  SELECT 'Profiles' as source, school_id FROM profiles
  UNION ALL
  SELECT 'Fees' as source, school_id FROM fees
  UNION ALL
  SELECT 'Students' as source, school_id FROM students
) as all_data
ORDER BY source, school_id;
