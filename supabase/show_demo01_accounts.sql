-- Show all accounts with DEMO01 that you can use
SELECT 
  email,
  full_name,
  role,
  school_id,
  '✓ USE ANY OF THESE ACCOUNTS' as instruction
FROM profiles
WHERE school_id = 'DEMO01' 
  AND role IN ('admin', 'principal')
ORDER BY email;
