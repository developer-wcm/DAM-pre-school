-- ============================================================================
-- Demo: Create Fee Installment Plans
-- ============================================================================
-- This file demonstrates how to create monthly and quarterly fee installments
-- Run add_fee_installments.sql first before running this demo
-- ============================================================================

-- Example 1: Create Monthly Installment Plan (12 months)
-- Total Fee: ₹70,000 divided into 12 monthly payments of ₹5,833.33 each
-- ============================================================================
SELECT create_fee_installments(
  'SCHOOL123',                          -- school_id (replace with your school's join_code)
  'student-uuid-here',                  -- student_id (replace with actual student UUID)
  'Tuition',                            -- fee_type
  70000.00,                             -- total_amount
  'monthly',                            -- installment_plan (monthly = 12 installments)
  '2025-04-01'::DATE,                  -- start_date (first installment due date)
  'Annual Tuition Fee 2025-26',        -- label (optional)
  'admin-uuid-here'                     -- created_by (optional, admin/principal UUID)
);

-- This will create:
-- - 1 parent record (installment_number = 0) for tracking
-- - 12 child records (installment_number = 1 to 12) with labels like:
--   * "Tuition - April 2025" (₹5,833.33, due: 2025-04-01)
--   * "Tuition - May 2025" (₹5,833.33, due: 2025-05-01)
--   * "Tuition - June 2025" (₹5,833.33, due: 2025-06-01)
--   * ... and so on until March 2026

-- ============================================================================
-- Example 2: Create Quarterly Installment Plan (4 quarters)
-- Total Fee: ₹70,000 divided into 4 quarterly payments of ₹17,500 each
-- ============================================================================
SELECT create_fee_installments(
  'SCHOOL123',                          -- school_id
  'student-uuid-here',                  -- student_id
  'Tuition',                            -- fee_type
  70000.00,                             -- total_amount
  'quarterly',                          -- installment_plan (quarterly = 4 installments)
  '2025-04-01'::DATE,                  -- start_date
  'Annual Tuition Fee 2025-26',        -- label
  'admin-uuid-here'                     -- created_by
);

-- This will create:
-- - 1 parent record (installment_number = 0) for tracking
-- - 4 child records (installment_number = 1 to 4) with labels like:
--   * "Tuition - Q1 2025" (₹17,500, due: 2025-04-01)
--   * "Tuition - Q2 2025" (₹17,500, due: 2025-07-01)
--   * "Tuition - Q3 2025" (₹17,500, due: 2025-10-01)
--   * "Tuition - Q4 2025" (₹17,500, due: 2026-01-01)

-- ============================================================================
-- Example 3: Create One-Time Fee (No Installments)
-- For fees that don't need installments (admission fee, exam fee, etc.)
-- ============================================================================
INSERT INTO fees (
  school_id,
  student_id,
  fee_type,
  amount,
  due_date,
  paid,
  installment_plan,
  installment_number,
  total_installments,
  label,
  created_by
) VALUES (
  'SCHOOL123',
  'student-uuid-here',
  'Admission',
  5000.00,
  '2025-04-01'::DATE,
  FALSE,
  'one-time',
  1,
  1,
  'Admission Fee',
  'admin-uuid-here'
);

-- ============================================================================
-- Query Examples
-- ============================================================================

-- View all installments for a student
SELECT 
  label,
  amount,
  due_date,
  paid,
  installment_plan,
  installment_number || '/' || total_installments as installment,
  CASE 
    WHEN paid THEN 'PAID'
    WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
    ELSE 'PENDING'
  END as status
FROM fees
WHERE student_id = 'student-uuid-here'
  AND installment_number > 0  -- Exclude parent records
ORDER BY due_date;

-- View payment summary for a student
SELECT 
  installment_plan,
  COUNT(*) as total_installments,
  SUM(amount) as total_amount,
  SUM(CASE WHEN paid THEN amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN NOT paid THEN amount ELSE 0 END) as outstanding_amount,
  ROUND(
    (SUM(CASE WHEN paid THEN amount ELSE 0 END) / SUM(amount) * 100)::numeric, 
    0
  ) as payment_percentage
FROM fees
WHERE student_id = 'student-uuid-here'
  AND installment_number > 0
GROUP BY installment_plan;

-- Find overdue installments across all students
SELECT 
  s.full_name,
  s.class,
  f.label,
  f.amount,
  f.due_date,
  DATE_PART('day', CURRENT_DATE - f.due_date) as days_overdue
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.paid = FALSE
  AND f.due_date < CURRENT_DATE
  AND f.installment_number > 0
ORDER BY f.due_date;

-- ============================================================================
-- Mark an installment as paid
-- ============================================================================
UPDATE fees
SET 
  paid = TRUE,
  paid_amount = amount,
  paid_date = CURRENT_DATE,
  payment_method = 'upi',
  transaction_id = 'TXN123456789',
  updated_at = NOW()
WHERE id = 'installment-uuid-here';

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. Monthly plan creates 12 installments (one per month)
-- 2. Quarterly plan creates 4 installments (one per quarter)
-- 3. The last installment is adjusted to account for rounding differences
-- 4. Parent records (installment_number = 0) are used for tracking only
-- 5. Only child records (installment_number > 0) appear in the UI
-- 6. Each installment shows a badge like "1/12" or "3/4" in the UI
