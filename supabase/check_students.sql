-- Check what school_id your students actually have
SELECT 
  id,
  full_name,
  class,
  school_id,
  status
FROM students
ORDER BY school_id, class, full_name
LIMIT 20;

-- Check if there are any fees already
SELECT COUNT(*) as fee_count, school_id
FROM fees
GROUP BY school_id;

-- Check what school codes exist
SELECT DISTINCT school_id
FROM students
WHERE status = 'active';
