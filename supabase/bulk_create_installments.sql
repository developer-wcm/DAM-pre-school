-- ============================================================================
-- Bulk Create Fee Installments for All Students
-- ============================================================================
-- This script creates fee installment plans for all active students at once
-- Run add_fee_installments.sql first before running this script
-- ============================================================================

-- ============================================================================
-- Option 1: Create MONTHLY installments for ALL active students
-- ============================================================================
-- This will create 12 monthly installments of ₹5,833.33 each (total ₹70,000)
-- for every active student in your school

DO $$
DECLARE
  student_record RECORD;
  parent_fee_id UUID;
BEGIN
  -- Loop through all active students
  FOR student_record IN 
    SELECT id, school_id, full_name, class
    FROM students
    WHERE status = 'active'
    ORDER BY class, full_name
  LOOP
    -- Create monthly installment plan for this student
    SELECT create_fee_installments(
      student_record.school_id,           -- school_id
      student_record.id,                  -- student_id
      'Tuition',                          -- fee_type
      70000.00,                           -- total_amount (₹70,000)
      'monthly',                          -- installment_plan (12 months)
      '2025-04-01'::DATE,                -- start_date (April 1, 2025)
      'Annual Tuition Fee 2025-26',      -- label
      NULL                                -- created_by (set to NULL or your admin UUID)
    ) INTO parent_fee_id;
    
    RAISE NOTICE 'Created monthly installments for: % (Class: %, ID: %)', 
      student_record.full_name, 
      student_record.class,
      parent_fee_id;
  END LOOP;
  
  RAISE NOTICE 'Completed! Monthly installments created for all active students.';
END $$;

-- ============================================================================
-- Option 2: Create QUARTERLY installments for ALL active students
-- ============================================================================
-- This will create 4 quarterly installments of ₹17,500 each (total ₹70,000)
-- for every active student in your school

-- UNCOMMENT THE BLOCK BELOW TO USE QUARTERLY INSTEAD OF MONTHLY:

/*
DO $$
DECLARE
  student_record RECORD;
  parent_fee_id UUID;
BEGIN
  -- Loop through all active students
  FOR student_record IN 
    SELECT id, school_id, full_name, class
    FROM students
    WHERE status = 'active'
    ORDER BY class, full_name
  LOOP
    -- Create quarterly installment plan for this student
    SELECT create_fee_installments(
      student_record.school_id,           -- school_id
      student_record.id,                  -- student_id
      'Tuition',                          -- fee_type
      70000.00,                           -- total_amount (₹70,000)
      'quarterly',                        -- installment_plan (4 quarters)
      '2025-04-01'::DATE,                -- start_date (April 1, 2025)
      'Annual Tuition Fee 2025-26',      -- label
      NULL                                -- created_by (set to NULL or your admin UUID)
    ) INTO parent_fee_id;
    
    RAISE NOTICE 'Created quarterly installments for: % (Class: %, ID: %)', 
      student_record.full_name, 
      student_record.class,
      parent_fee_id;
  END LOOP;
  
  RAISE NOTICE 'Completed! Quarterly installments created for all active students.';
END $$;
*/

-- ============================================================================
-- Option 3: Create installments for SPECIFIC CLASS only
-- ============================================================================
-- Example: Create monthly installments only for Pre-KG students

/*
DO $$
DECLARE
  student_record RECORD;
  parent_fee_id UUID;
BEGIN
  FOR student_record IN 
    SELECT id, school_id, full_name, class
    FROM students
    WHERE status = 'active'
      AND class = 'PKG'  -- Change to 'PG', 'JKG', 'SKG' as needed
    ORDER BY full_name
  LOOP
    SELECT create_fee_installments(
      student_record.school_id,
      student_record.id,
      'Tuition',
      70000.00,
      'monthly',
      '2025-04-01'::DATE,
      'Annual Tuition Fee 2025-26',
      NULL
    ) INTO parent_fee_id;
    
    RAISE NOTICE 'Created installments for: % (ID: %)', 
      student_record.full_name,
      parent_fee_id;
  END LOOP;
END $$;
*/

-- ============================================================================
-- Option 4: Create DIFFERENT amounts for DIFFERENT classes
-- ============================================================================
-- Example: Different fee amounts based on class

/*
DO $$
DECLARE
  student_record RECORD;
  parent_fee_id UUID;
  fee_amount DECIMAL;
BEGIN
  FOR student_record IN 
    SELECT id, school_id, full_name, class
    FROM students
    WHERE status = 'active'
    ORDER BY class, full_name
  LOOP
    -- Set different amounts based on class
    CASE student_record.class
      WHEN 'PG' THEN fee_amount := 60000.00;   -- ₹60,000 for Play Group
      WHEN 'PKG' THEN fee_amount := 65000.00;  -- ₹65,000 for Pre-KG
      WHEN 'JKG' THEN fee_amount := 70000.00;  -- ₹70,000 for Junior KG
      WHEN 'SKG' THEN fee_amount := 75000.00;  -- ₹75,000 for Senior KG
      ELSE fee_amount := 70000.00;             -- Default ₹70,000
    END CASE;
    
    SELECT create_fee_installments(
      student_record.school_id,
      student_record.id,
      'Tuition',
      fee_amount,
      'monthly',
      '2025-04-01'::DATE,
      'Annual Tuition Fee 2025-26',
      NULL
    ) INTO parent_fee_id;
    
    RAISE NOTICE 'Created installments for: % (Class: %, Amount: ₹%, ID: %)', 
      student_record.full_name,
      student_record.class,
      fee_amount,
      parent_fee_id;
  END LOOP;
END $$;
*/

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check how many students got installments created
SELECT 
  s.class,
  COUNT(DISTINCT f.student_id) as students_with_fees,
  f.installment_plan,
  f.total_installments
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.installment_number > 0
GROUP BY s.class, f.installment_plan, f.total_installments
ORDER BY s.class;

-- View sample installments for verification
SELECT 
  s.full_name,
  s.class,
  f.label,
  f.amount,
  f.due_date,
  f.installment_number || '/' || f.total_installments as installment
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.installment_number > 0
ORDER BY s.full_name, f.due_date
LIMIT 20;

-- Check total fees created
SELECT 
  COUNT(*) as total_installment_records,
  SUM(amount) as total_amount,
  installment_plan
FROM fees
WHERE installment_number > 0
GROUP BY installment_plan;

-- ============================================================================
-- Clean Up (if you need to start over)
-- ============================================================================
-- WARNING: This will delete ALL fee records. Use with caution!

/*
-- Delete all fee installments (keeps the table structure)
DELETE FROM fees;

-- Reset and start fresh
TRUNCATE TABLE fees CASCADE;
*/

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. By default, Option 1 (MONTHLY) is active - it will run when you execute this file
-- 2. To use QUARTERLY instead, comment out Option 1 and uncomment Option 2
-- 3. The script only creates fees for students with status = 'active'
-- 4. You can customize the amount, start date, and fee type as needed
-- 5. The script shows progress messages as it creates installments
-- 6. Run the verification queries at the end to confirm everything worked
-- 7. If you need to redo, use the cleanup section (be careful!)
