-- Simple check: What will the fees screen actually see?

-- Simulate what the fees.tsx screen queries

-- Query 1: Students (what the screen fetches)
SELECT 
  '1. STUDENTS QUERY RESULT' as info,
  id,
  full_name,
  class,
  school_id
FROM students
WHERE school_id = 'DEMO01'
  AND status = 'active'
ORDER BY class, full_name;

-- Query 2: Fees (what the screen fetches)
SELECT 
  '2. FEES QUERY RESULT' as info,
  COUNT(*) as total_fee_records,
  COUNT(CASE WHEN installment_number != 0 THEN 1 END) as visible_to_screen,
  COUNT(CASE WHEN installment_number = 0 THEN 1 END) as excluded_parent_records
FROM fees
WHERE school_id = 'DEMO01';

-- Query 3: Detailed fee breakdown
SELECT 
  '3. FEE BREAKDOWN' as info,
  student_id,
  COUNT(*) as fee_count,
  SUM(amount) as total_amount,
  SUM(CASE WHEN paid THEN amount ELSE 0 END) as paid_amount
FROM fees
WHERE school_id = 'DEMO01'
  AND installment_number != 0
GROUP BY student_id
ORDER BY student_id;

-- Query 4: Overall stats (what shows in the circle)
SELECT 
  '4. OVERALL STATS' as info,
  SUM(amount) as total_expected,
  SUM(CASE WHEN paid THEN amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN NOT paid THEN amount ELSE 0 END) as total_due,
  ROUND((SUM(CASE WHEN paid THEN amount ELSE 0 END) / NULLIF(SUM(amount), 0) * 100)::numeric, 0) as percentage
FROM fees
WHERE school_id = 'DEMO01'
  AND installment_number != 0;
