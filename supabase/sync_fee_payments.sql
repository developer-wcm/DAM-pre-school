-- ============================================================================
-- Sync Fee Payments Between Monthly and Quarterly Plans
-- ============================================================================
-- When a quarterly fee is paid, mark corresponding monthly fees as paid
-- When monthly fees are paid, check if quarterly should be marked paid

CREATE OR REPLACE FUNCTION sync_fee_payment()
RETURNS TRIGGER AS $$
DECLARE
  quarter_start_month INTEGER;
  quarter_end_month INTEGER;
  monthly_paid_count INTEGER;
  total_monthly_in_quarter INTEGER;
BEGIN
  -- Only process if payment status changed to paid
  IF NEW.paid = TRUE AND (OLD.paid IS NULL OR OLD.paid = FALSE) THEN
    
    -- Case 1: Quarterly payment made -> Mark monthly fees as paid
    IF NEW.installment_plan = 'quarterly' THEN
      -- Calculate which months this quarter covers
      -- Q1 (installment 1) = months 1,2,3
      -- Q2 (installment 2) = months 4,5,6
      -- Q3 (installment 3) = months 7,8,9
      -- Q4 (installment 4) = months 10,11,12
      
      quarter_start_month := (NEW.installment_number - 1) * 3 + 1;
      quarter_end_month := NEW.installment_number * 3;
      
      -- Mark corresponding monthly fees as paid
      UPDATE fees
      SET 
        paid = TRUE,
        paid_date = NEW.paid_date,
        payment_method = NEW.payment_method,
        transaction_id = NEW.transaction_id,
        updated_at = NOW()
      WHERE 
        student_id = NEW.student_id
        AND installment_plan = 'monthly'
        AND installment_number >= quarter_start_month
        AND installment_number <= quarter_end_month
        AND paid = FALSE;
        
      RAISE NOTICE 'Quarterly payment synced: Marked monthly installments % to % as paid', 
        quarter_start_month, quarter_end_month;
    
    -- Case 2: Monthly payment made -> Check if quarterly should be marked paid
    ELSIF NEW.installment_plan = 'monthly' THEN
      -- Determine which quarter this month belongs to
      -- Months 1-3 = Q1, 4-6 = Q2, 7-9 = Q3, 10-12 = Q4
      
      quarter_start_month := ((NEW.installment_number - 1) / 3) * 3 + 1;
      quarter_end_month := quarter_start_month + 2;
      
      -- Count how many monthly fees in this quarter are paid
      SELECT COUNT(*) INTO monthly_paid_count
      FROM fees
      WHERE 
        student_id = NEW.student_id
        AND installment_plan = 'monthly'
        AND installment_number >= quarter_start_month
        AND installment_number <= quarter_end_month
        AND paid = TRUE;
      
      -- If all 3 months in the quarter are paid, mark quarterly as paid
      IF monthly_paid_count = 3 THEN
        UPDATE fees
        SET 
          paid = TRUE,
          paid_date = NEW.paid_date,
          payment_method = NEW.payment_method,
          transaction_id = NEW.transaction_id,
          updated_at = NOW()
        WHERE 
          student_id = NEW.student_id
          AND installment_plan = 'quarterly'
          AND installment_number = ((quarter_start_month - 1) / 3) + 1
          AND paid = FALSE;
          
        RAISE NOTICE 'Monthly payments complete: Marked quarterly installment % as paid', 
          ((quarter_start_month - 1) / 3) + 1;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_fee_payment_trigger ON fees;
CREATE TRIGGER sync_fee_payment_trigger
  AFTER UPDATE ON fees
  FOR EACH ROW
  EXECUTE FUNCTION sync_fee_payment();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_fee_payment TO authenticated;

COMMENT ON FUNCTION sync_fee_payment IS 'Automatically syncs payment status between monthly and quarterly fee plans';

-- ============================================================================
-- Test the sync (optional)
-- ============================================================================

-- Example: Mark a quarterly fee as paid and watch monthly fees update
/*
UPDATE fees
SET 
  paid = TRUE,
  paid_date = CURRENT_DATE,
  payment_method = 'upi',
  transaction_id = 'TEST123'
WHERE 
  student_id = 'your-student-id'
  AND installment_plan = 'quarterly'
  AND installment_number = 1;

-- Check that monthly fees 1, 2, 3 are now marked as paid
SELECT 
  installment_plan,
  installment_number,
  paid,
  paid_date
FROM fees
WHERE student_id = 'your-student-id'
ORDER BY installment_plan, installment_number;
*/
