-- Show all admin/principal profiles sorted by most recently updated
SELECT 
  email,
  full_name,
  role,
  school_id,
  CASE 
    WHEN school_id = 'DEMO01' THEN '✓ Can see fees'
    WHEN school_id = 'DEM001' THEN '✗ Cannot see fees'
    ELSE '? Unknown'
  END as fee_access,
  updated_at,
  created_at
FROM profiles
WHERE role IN ('admin', 'principal')
ORDER BY updated_at DESC NULLS LAST, created_at DESC;
