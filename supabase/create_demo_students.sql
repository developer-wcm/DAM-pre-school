-- ============================================================================
-- CREATE DEMO STUDENTS
-- Run this AFTER demo_users.sql to populate students for testing
-- ============================================================================

-- Ensure school exists
INSERT INTO schools (join_code, name, teacher_join_code)
VALUES ('DEMO001', 'DAM PreSchool', 'TEACH01')
ON CONFLICT (join_code) DO NOTHING;

-- Delete existing demo students (if any) to avoid duplicates
DELETE FROM students WHERE school_id = 'DEMO001';

-- ============================================================================
-- CREATE STUDENTS - Play Group (PG)
-- ============================================================================
INSERT INTO students (school_id, full_name, class, roll_number, date_of_birth, gender, status, admission_date)
VALUES 
  ('DEMO001', 'Aarav Sharma', 'PG', 'PG001', '2022-06-15', 'male', 'active', '2025-04-01'),
  ('DEMO001', 'Ananya Patel', 'PG', 'PG002', '2022-07-20', 'female', 'active', '2025-04-01'),
  ('DEMO001', 'Arjun Kumar', 'PG', 'PG003', '2022-08-10', 'male', 'active', '2025-04-01'),
  ('DEMO001', 'Diya Singh', 'PG', 'PG004', '2022-05-25', 'female', 'active', '2025-04-01'),
  ('DEMO001', 'Ishaan Verma', 'PG', 'PG005', '2022-09-05', 'male', 'active', '2025-04-01');

-- ============================================================================
-- CREATE STUDENTS - Pre-KG (PKG)
-- ============================================================================
INSERT INTO students (school_id, full_name, class, roll_number, date_of_birth, gender, status, admission_date)
VALUES 
  ('DEMO001', 'Kavya Reddy', 'PKG', 'PKG001', '2021-06-12', 'female', 'active', '2024-04-01'),
  ('DEMO001', 'Reyansh Gupta', 'PKG', 'PKG002', '2021-07-18', 'male', 'active', '2024-04-01'),
  ('DEMO001', 'Saanvi Joshi', 'PKG', 'PKG003', '2021-08-22', 'female', 'active', '2024-04-01'),
  ('DEMO001', 'Vihaan Kapoor', 'PKG', 'PKG004', '2021-05-30', 'male', 'active', '2024-04-01'),
  ('DEMO001', 'Zara Khan', 'PKG', 'PKG005', '2021-09-14', 'female', 'active', '2024-04-01');

-- ============================================================================
-- CREATE STUDENTS - Junior KG (JKG)
-- ============================================================================
INSERT INTO students (school_id, full_name, class, roll_number, date_of_birth, gender, status, admission_date)
VALUES 
  ('DEMO001', 'Aditya Mehta', 'JKG', 'JKG001', '2020-06-08', 'male', 'active', '2023-04-01'),
  ('DEMO001', 'Myra Desai', 'JKG', 'JKG002', '2020-07-15', 'female', 'active', '2023-04-01'),
  ('DEMO001', 'Rohan Nair', 'JKG', 'JKG003', '2020-08-20', 'male', 'active', '2023-04-01'),
  ('DEMO001', 'Tara Malhotra', 'JKG', 'JKG004', '2020-05-18', 'female', 'active', '2023-04-01'),
  ('DEMO001', 'Yash Pandey', 'JKG', 'JKG005', '2020-09-10', 'male', 'active', '2023-04-01');

-- ============================================================================
-- CREATE STUDENTS - Senior KG (SKG)
-- ============================================================================
INSERT INTO students (school_id, full_name, class, roll_number, date_of_birth, gender, status, admission_date)
VALUES 
  ('DEMO001', 'Advika Iyer', 'SKG', 'SKG001', '2019-06-05', 'female', 'active', '2022-04-01'),
  ('DEMO001', 'Krish Agarwal', 'SKG', 'SKG002', '2019-07-12', 'male', 'active', '2022-04-01'),
  ('DEMO001', 'Navya Rao', 'SKG', 'SKG003', '2019-08-18', 'female', 'active', '2022-04-01'),
  ('DEMO001', 'Pranav Jain', 'SKG', 'SKG004', '2019-05-22', 'male', 'active', '2022-04-01'),
  ('DEMO001', 'Riya Saxena', 'SKG', 'SKG005', '2019-09-08', 'female', 'active', '2022-04-01');

-- ============================================================================
-- VERIFY STUDENTS CREATED
-- ============================================================================
SELECT 
  class,
  COUNT(*) as count,
  STRING_AGG(full_name, ', ' ORDER BY roll_number) as students
FROM students
WHERE school_id = 'DEMO001'
GROUP BY class
ORDER BY class;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 
  'Total Students Created:' as info,
  COUNT(*) as count
FROM students
WHERE school_id = 'DEMO001';

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. Run fee_structure_config.sql to create fee installments for these students
-- 2. Login as admin@dampreschool.com (password: admin123)
-- 3. View students in the app
-- ============================================================================
