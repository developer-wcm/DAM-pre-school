-- OPTION 2: Move everything TO DEM001 (instead of moving profiles to DEMO01)
-- This way the 1 stubborn profile with DEM001 will work

-- Step 1: Update all profiles from DEMO01 to DEM001
UPDATE profiles
SET school_id = 'DEM001',
    updated_at = NOW()
WHERE school_id = 'DEMO01';

-- Step 2: Update all students from DEMO01 to DEM001
UPDATE students
SET school_id = 'DEM001',
    updated_at = NOW()
WHERE school_id = 'DEMO01';

-- Step 3: Update all fees from DEMO01 to DEM001
UPDATE fees
SET school_id = 'DEM001',
    updated_at = NOW()
WHERE school_id = 'DEMO01';

-- Step 4: Update schools table if it exists
UPDATE schools
SET join_code = 'DEM001'
WHERE join_code = 'DEMO01';

-- Verification: Everything should be DEM001 now
SELECT 
  'Profiles' as table_name,
  school_id,
  COUNT(*) as count
FROM profiles
GROUP BY school_id
UNION ALL
SELECT 
  'Students' as table_name,
  school_id,
  COUNT(*) as count
FROM students
GROUP BY school_id
UNION ALL
SELECT 
  'Fees' as table_name,
  school_id,
  COUNT(*) as count
FROM fees
GROUP BY school_id
ORDER BY table_name, school_id;
