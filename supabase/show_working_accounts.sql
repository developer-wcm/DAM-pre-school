-- Show accounts with DEMO01 that WILL WORK
SELECT 
  '✓ USE THIS ACCOUNT' as action,
  email,
  full_name,
  role
FROM profiles
WHERE school_id = 'DEMO01' 
  AND role IN ('admin', 'principal')
ORDER BY role, email;

-- Show the ONE account with DEM001 that WON'T WORK
SELECT 
  '✗ DO NOT USE THIS' as action,
  email,
  full_name,
  role
FROM profiles
WHERE school_id = 'DEM001';
