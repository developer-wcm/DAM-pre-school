-- ============================================================================
-- Manual Sync: Update Monthly Fees Based on Quarterly Payments
-- ============================================================================
-- Run this ONCE to sync existing quarterly payments to monthly fees

DO $$
DECLARE
  quarterly_fee RECORD;
  quarter_start_month INTEGER;
  quarter_end_month INTEGER;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting manual sync of quarterly to monthly payments...';
  
  -- Loop through all PAID quarterly fees
  FOR quarterly_fee IN 
    SELECT 
      id,
      student_id,
      installment_number,
      paid_date,
      payment_method,
      transaction_id
    FROM fees
    WHERE installment_plan = 'quarterly'
      AND paid = TRUE
      AND installment_number > 0
    ORDER BY student_id, installment_number
  LOOP
    -- Calculate which months this quarter covers
    quarter_start_month := (quarterly_fee.installment_number - 1) * 3 + 1;
    quarter_end_month := quarterly_fee.installment_number * 3;
    
    -- Update corresponding monthly fees
    UPDATE fees
    SET 
      paid = TRUE,
      paid_date = quarterly_fee.paid_date,
      payment_method = quarterly_fee.payment_method,
      transaction_id = quarterly_fee.transaction_id,
      updated_at = NOW()
    WHERE 
      student_id = quarterly_fee.student_id
      AND installment_plan = 'monthly'
      AND installment_number >= quarter_start_month
      AND installment_number <= quarter_end_month
      AND paid = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
      RAISE NOTICE 'Student: % | Q% paid -> Updated % monthly fees (months %-%))',
        quarterly_fee.student_id,
        quarterly_fee.installment_number,
        updated_count,
        quarter_start_month,
        quarter_end_month;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Manual sync completed!';
END $$;

-- Verify the sync
SELECT 
  s.full_name,
  f.installment_plan,
  COUNT(*) as total_installments,
  SUM(CASE WHEN f.paid THEN 1 ELSE 0 END) as paid_count,
  SUM(CASE WHEN NOT f.paid THEN 1 ELSE 0 END) as unpaid_count
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.installment_number > 0
GROUP BY s.full_name, f.installment_plan
ORDER BY s.full_name, f.installment_plan;
