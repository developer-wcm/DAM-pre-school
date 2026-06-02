-- Find profiles that actually have emails (can be used for login)
SELECT 
  id,
  email,
  full_name,
  role,
  school_id,
  CASE 
    WHEN school_id = 'DEMO01' THEN '✓ Has DEMO01 - Will work'
    WHEN school_id = 'DEM001' THEN '✗ Has DEM001 - Won''t work'
    ELSE '? Unknown'
  END as status
FROM profiles
WHERE email IS NOT NULL
  AND role IN ('admin', 'principal')
ORDER BY school_id, email;

-- Count how many have emails vs don't
SELECT 
  school_id,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as without_email
FROM profiles
WHERE role IN ('admin', 'principal')
GROUP BY school_id;
