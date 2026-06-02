-- Create fee installments for all active students with school_id = 'DEMO01'
-- This creates BOTH monthly and quarterly plans so students can toggle between them

DO $$
DECLARE
  student_rec RECORD;
  annual_fee NUMERIC;
  monthly_amount NUMERIC;
  quarterly_amount NUMERIC;
  install_num INT;
  due_month DATE;
BEGIN
  -- Loop through all active students with school_id = DEMO01
  FOR student_rec IN 
    SELECT id, full_name, class, school_id 
    FROM students 
    WHERE status = 'active' AND school_id = 'DEMO01'
  LOOP
    -- Determine annual fee based on class
    CASE student_rec.class
      WHEN 'PG' THEN annual_fee := 60000;
      WHEN 'PKG' THEN annual_fee := 65000;
      WHEN 'JKG' THEN annual_fee := 70000;
      WHEN 'SKG' THEN annual_fee := 75000;
      ELSE annual_fee := 60000;
    END CASE;

    monthly_amount := ROUND(annual_fee / 12, 2);
    quarterly_amount := ROUND(annual_fee / 4, 2);

    RAISE NOTICE 'Creating fees for: % (Class: %, Annual: Rs.%)', 
      student_rec.full_name, student_rec.class, annual_fee;

    -- ========== CREATE MONTHLY PLAN (12 installments) ==========
    FOR install_num IN 1..12 LOOP
      due_month := DATE '2025-04-01' + ((install_num - 1) || ' months')::INTERVAL;
      
      INSERT INTO fees (
        student_id, school_id, fee_type, label, description, amount,
        installment_plan, installment_number, total_installments,
        due_date, paid, created_at
      ) VALUES (
        student_rec.id, 
        student_rec.school_id,
        'Tuition',
        'Tuition Fee - Month ' || install_num,
        'Monthly installment ' || install_num || ' of 12',
        monthly_amount,
        'monthly', 
        install_num, 
        12,
        due_month, 
        false, 
        NOW()
      );
    END LOOP;

    -- ========== CREATE QUARTERLY PLAN (4 installments) ==========
    FOR install_num IN 1..4 LOOP
      due_month := DATE '2025-04-01' + ((install_num - 1) * 3 || ' months')::INTERVAL;
      
      INSERT INTO fees (
        student_id, school_id, fee_type, label, description, amount,
        installment_plan, installment_number, total_installments,
        due_date, paid, created_at
      ) VALUES (
        student_rec.id, 
        student_rec.school_id,
        'Tuition',
        'Tuition Fee - Quarter ' || install_num,
        'Quarterly installment ' || install_num || ' of 4',
        quarterly_amount,
        'quarterly', 
        install_num, 
        4,
        due_month, 
        false, 
        NOW()
      );
    END LOOP;

  END LOOP;

  RAISE NOTICE '✓ Fee installments created successfully for all students!';
END $$;

-- Verification: Check what was created
SELECT 
  s.full_name,
  s.class,
  COUNT(CASE WHEN f.installment_plan = 'monthly' THEN 1 END) as monthly_count,
  COUNT(CASE WHEN f.installment_plan = 'quarterly' THEN 1 END) as quarterly_count,
  SUM(CASE WHEN f.installment_plan = 'monthly' THEN f.amount ELSE 0 END) as monthly_total,
  SUM(CASE WHEN f.installment_plan = 'quarterly' THEN f.amount ELSE 0 END) as quarterly_total
FROM students s
LEFT JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active' AND s.school_id = 'DEMO01'
GROUP BY s.full_name, s.class
ORDER BY s.class, s.full_name;
