-- Show profiles that will be deleted (DEM001 - the old wrong ones)
SELECT 
  email,
  full_name,
  role,
  school_id,
  'Will be DELETED (old/wrong)' as action
FROM profiles
WHERE school_id = 'DEM001';

-- Show profiles that will be kept (DEMO01 - the correct ones)
SELECT 
  email,
  full_name,
  role,
  school_id,
  'Will be KEPT (correct)' as action
FROM profiles
WHERE school_id = 'DEMO01';

-- Delete the old DEM001 profiles
DELETE FROM profiles
WHERE school_id = 'DEM001';

-- Final check - should only have DEMO01 now
SELECT 
  'After cleanup' as status,
  school_id,
  COUNT(*) as profile_count
FROM profiles
GROUP BY school_id;
