-- PG: ₹60,000 | PKG: ₹65,000 | JKG: ₹70,000 | SKG: ₹75,000

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
    CASE student_record.class
      WHEN 'PG' THEN fee_amount := 60000.00;
      WHEN 'PKG' THEN fee_amount := 65000.00;
      WHEN 'JKG' THEN fee_amount := 70000.00;
      WHEN 'SKG' THEN fee_amount := 75000.00;
      ELSE fee_amount := 70000.00;
    END CASE;
    
    SELECT create_fee_installments(
      student_record.school_id,
      student_record.id,
      'Tuition',
      fee_amount,
      'monthly',
      '2025-04-01'::DATE,
      'Annual Tuition Fee 2025-26 (Monthly)',
      NULL
    ) INTO parent_fee_id;
    
    RAISE NOTICE '[MONTHLY] % (%) - ₹%', 
      student_record.full_name,
      student_record.class,
      fee_amount;
  END LOOP;
END $$;

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
    CASE student_record.class
      WHEN 'PG' THEN fee_amount := 60000.00;
      WHEN 'PKG' THEN fee_amount := 65000.00;
      WHEN 'JKG' THEN fee_amount := 70000.00;
      WHEN 'SKG' THEN fee_amount := 75000.00;
      ELSE fee_amount := 70000.00;
    END CASE;
    
    SELECT create_fee_installments(
      student_record.school_id,
      student_record.id,
      'Tuition',
      fee_amount,
      'quarterly',
      '2025-04-01'::DATE,
      'Annual Tuition Fee 2025-26 (Quarterly)',
      NULL
    ) INTO parent_fee_id;
    
    RAISE NOTICE '[QUARTERLY] % (%) - ₹%', 
      student_record.full_name,
      student_record.class,
      fee_amount;
  END LOOP;
END $$;

SELECT 
  s.class,
  f.installment_plan,
  COUNT(DISTINCT f.student_id) as students,
  SUM(f.amount) as total
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.installment_number > 0
GROUP BY s.class, f.installment_plan
ORDER BY s.class, f.installment_plan;
