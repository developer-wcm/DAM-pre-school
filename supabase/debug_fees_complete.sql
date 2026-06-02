-- Complete diagnostic for fees screen
-- Run this to see exactly what the fees screen is fetching

-- 1. Check if fees exist
SELECT 'STEP 1: Total Fees in Database' as step;
SELECT 
  school_id,
  COUNT(*) as total_fees,
  COUNT(CASE WHEN paid = true THEN 1 END) as paid_fees,
  COUNT(CASE WHEN paid = false THEN 1 END) as unpaid_fees,
  COUNT(CASE WHEN installment_number != 0 THEN 1 END) as installment_fees,
  COUNT(CASE WHEN installment_number = 0 THEN 1 END) as parent_records
FROM fees
GROUP BY school_id;

-- 2. Check students
SELECT 'STEP 2: Students' as step;
SELECT 
  school_id,
  COUNT(*) as total_students,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students
FROM students
GROUP BY school_id;

-- 3. Check actual fees by class (what the screen should show)
SELECT 'STEP 3: Fees by Class' as step;
SELECT 
  s.class,
  COUNT(DISTINCT s.id) as student_count,
  COUNT(f.id) as fee_count,
  SUM(f.amount) as total_amount,
  SUM(CASE WHEN f.paid = true THEN f.amount ELSE 0 END) as collected_amount,
  SUM(CASE WHEN f.paid = false THEN f.amount ELSE 0 END) as due_amount,
  ROUND((SUM(CASE WHEN f.paid = true THEN f.amount ELSE 0 END) / NULLIF(SUM(f.amount), 0) * 100)::numeric, 2) as collection_percentage
FROM students s
LEFT JOIN fees f ON s.id = f.student_id AND f.school_id = 'DEMO01' AND f.installment_number != 0
WHERE s.school_id = 'DEMO01' AND s.status = 'active'
GROUP BY s.class
ORDER BY s.class;

-- 4. Sample fees data
SELECT 'STEP 4: Sample Fee Records' as step;
SELECT 
  f.id,
  s.full_name as student,
  s.class,
  f.label,
  f.amount,
  f.paid,
  f.due_date,
  f.installment_plan,
  f.installment_number
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.school_id = 'DEMO01'
  AND f.installment_number != 0
ORDER BY s.class, s.full_name, f.installment_number
LIMIT 20;

-- 5. Check overdue fees
SELECT 'STEP 5: Overdue Students' as step;
SELECT 
  s.full_name,
  s.class,
  COUNT(f.id) as overdue_count,
  SUM(f.amount) as overdue_amount,
  MIN(f.due_date) as oldest_due_date
FROM students s
JOIN fees f ON s.id = f.student_id
WHERE s.school_id = 'DEMO01'
  AND s.status = 'active'
  AND f.paid = false
  AND f.due_date < CURRENT_DATE
  AND f.installment_number != 0
GROUP BY s.id, s.full_name, s.class
ORDER BY overdue_amount DESC
LIMIT 10;

-- 6. Check RLS policies on fees table
SELECT 'STEP 6: RLS Policies on Fees Table' as step;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'fees'
ORDER BY policyname;

-- 7. Test if current policies allow reading fees
SELECT 'STEP 7: Can profiles with DEMO01 access fees?' as step;
SELECT 
  'Profile' as source,
  p.email,
  p.role,
  p.school_id,
  COUNT(f.id) as visible_fees
FROM profiles p
LEFT JOIN fees f ON p.school_id = f.school_id
WHERE p.school_id = 'DEMO01'
  AND p.role IN ('admin', 'principal', 'accountant')
GROUP BY p.id, p.email, p.role, p.school_id;
