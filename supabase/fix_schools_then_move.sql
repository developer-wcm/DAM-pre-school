-- Check what's in the schools table
SELECT * FROM schools;

-- Step 1: Update schools table FIRST (this is the parent table)
UPDATE schools
SET join_code = 'DEM001'
WHERE join_code = 'DEMO01';

-- OR if DEM001 doesn't exist, insert it
INSERT INTO schools (join_code, name, created_at, updated_at)
SELECT 'DEM001', name, created_at, NOW()
FROM schools
WHERE join_code = 'DEMO01'
ON CONFLICT (join_code) DO NOTHING;

-- Step 2: Now update students (child table)
UPDATE students
SET school_id = 'DEM001',
    updated_at = NOW()
WHERE school_id = 'DEMO01';

-- Step 3: Update fees
UPDATE fees
SET school_id = 'DEM001',
    updated_at = NOW()
WHERE school_id = 'DEMO01';

-- Step 4: Update profiles  
UPDATE profiles
SET school_id = 'DEM001',
    updated_at = NOW()
WHERE school_id = 'DEMO01';

-- Final verification
SELECT 
  'Schools' as table_name,
  join_code as school_id,
  COUNT(*) as count
FROM schools
GROUP BY join_code
UNION ALL
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
