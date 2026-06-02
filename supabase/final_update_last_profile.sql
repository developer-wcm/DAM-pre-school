-- Find the stubborn profile that still has DEM001
SELECT 
  id,
  email,
  full_name,
  role,
  school_id,
  'This profile needs updating' as note
FROM profiles
WHERE school_id = 'DEM001';

-- Force update it using its ID
UPDATE profiles
SET school_id = 'DEMO01',
    updated_at = NOW()
WHERE school_id = 'DEM001'
RETURNING id, email, full_name, school_id;

-- Alternative: Update using the auth.users table if above doesn't work
UPDATE profiles
SET school_id = 'DEMO01'
WHERE id IN (
  SELECT id FROM profiles WHERE school_id = 'DEM001'
);

-- Final verification - should be ALL DEMO01 now
SELECT 
  school_id,
  COUNT(*) as count,
  CASE 
    WHEN school_id = 'DEMO01' THEN '✓ CORRECT'
    ELSE '✗ WRONG'
  END as status
FROM profiles
GROUP BY school_id;
