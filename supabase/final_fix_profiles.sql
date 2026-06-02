-- Show exactly which profiles have DEM001
SELECT 
  id,
  email,
  full_name,
  role,
  school_id
FROM profiles
WHERE school_id = 'DEM001';

-- Update them directly by ID
UPDATE profiles
SET school_id = 'DEMO01',
    updated_at = NOW()
WHERE school_id = 'DEM001';

-- If the above doesn't work, there might be a trigger or constraint
-- Let's also try updating by checking if it's not already DEMO01
UPDATE profiles
SET school_id = 'DEMO01',
    updated_at = NOW()
WHERE school_id != 'DEMO01';

-- Show the result
SELECT 
  school_id,
  COUNT(*) as profile_count,
  string_agg(DISTINCT role, ', ') as roles
FROM profiles
GROUP BY school_id;

-- Final check - count how many profiles each school_id has
SELECT 
  CASE 
    WHEN school_id = 'DEMO01' THEN '✓ DEMO01 (Correct)'
    ELSE '✗ ' || school_id || ' (Wrong)'
  END as status,
  COUNT(*) as count
FROM profiles
GROUP BY school_id;
