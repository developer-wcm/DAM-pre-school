-- Create fee installments for all active students
-- This will create both monthly and quarterly fee plans

DO $$
DECLARE
  student_rec RECORD;
  annual_fee NUMERIC;
  monthly_amount NUMERIC;
  quarterly_amount NUMERIC;
  parent_fee_id UUID;
  install_num INT;
  due_month DATE;
BEGIN
  -- Loop through all active students
  FOR student_rec IN 
    SELECT id, full_name, class, school_id 
    FROM students 
    WHERE status = 'active' AND school_id = 'DEMO001'
  LOOP
    -- Determine annual fee based on class
    CASE student_rec.class
      WHEN 'PG' THEN annual_fee := 60000;
      WHEN 'PKG' THEN annual_fee := 65000;
      WHEN 'JKG' THEN annual_fee := 70000;
      WHEN 'SKG' THEN annual_fee := 75000;
      ELSE annual_fee := 60000;
    END CASE;

    monthly_amount := annual_fee / 12;
    quarterly_amount := annual_fee / 4;

    RAISE NOTICE 'Creating fees for student: % (Class: %, Annual: %)', 
      student_rec.full_name, student_rec.class, annual_fee;

    -- Create MONTHLY plan parent record
    INSERT INTO fees (
      student_id, school_id, label, description, amount,
      installment_plan, installment_number, total_installments,
      due_date, paid, created_at
    ) VALUES (
      student_rec.id, student_rec.school_id,
      'Annual Tuition Fee', 'Annual tuition fee - Monthly plan', annual_fee,
      'monthly', 0, 12,
      NULL, false, NOW()
    ) RETURNING id INTO parent_fee_id;

    -- Create 12 monthly installments
    FOR install_num IN 1..12 LOOP
      due_month := DATE '2025-04-01' + ((install_num - 1) || ' months')::INTERVAL;
      
      INSERT INTO fees (
        student_id, school_id, label, description, amount,
        installment_plan, installment_number, total_installments,
        parent_fee_id, due_date, paid, created_at
      ) VALUES (
        student_rec.id, student_rec.school_id,
        'Tuition Fee - Month ' || install_num,
        'Monthly installment ' || install_num || ' of 12',
        monthly_amount,
        'monthly', install_num, 12,
        parent_fee_id, due_month, false, NOW()
      );
    END LOOP;

    -- Create QUARTERLY plan parent record
    INSERT INTO fees (
      student_id, school_id, label, description, amount,
      installment_plan, installment_number, total_installments,
      due_date, paid, created_at
    ) VALUES (
      student_rec.id, student_rec.school_id,
      'Annual Tuition Fee', 'Annual tuition fee - Quarterly plan', annual_fee,
      'quarterly', 0, 4,
      NULL, false, NOW()
    ) RETURNING id INTO parent_fee_id;

    -- Create 4 quarterly installments
    FOR install_num IN 1..4 LOOP
      due_month := DATE '2025-04-01' + ((install_num - 1) * 3 || ' months')::INTERVAL;
      
      INSERT INTO fees (
        student_id, school_id, label, description, amount,
        installment_plan, installment_number, total_installments,
        parent_fee_id, due_date, paid, created_at
      ) VALUES (
        student_rec.id, student_rec.school_id,
        'Tuition Fee - Quarter ' || install_num,
        'Quarterly installment ' || install_num || ' of 4',
        quarterly_amount,
        'quarterly', install_num, 4,
        parent_fee_id, due_month, false, NOW()
      );
    END LOOP;

  END LOOP;

  RAISE NOTICE 'Fee installments created successfully for all students!';
END $$;
