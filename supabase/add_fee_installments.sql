-- ============================================================================
-- Add Installment Support to Fees Table
-- Allows monthly (12 installments) or quarterly (4 installments) payment plans
-- ============================================================================

-- Add new columns for installment tracking
ALTER TABLE fees
ADD COLUMN IF NOT EXISTS installment_plan TEXT CHECK (installment_plan IN ('monthly', 'quarterly', 'one-time')),
ADD COLUMN IF NOT EXISTS installment_number INTEGER,
ADD COLUMN IF NOT EXISTS total_installments INTEGER,
ADD COLUMN IF NOT EXISTS parent_fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS label TEXT;

-- Update existing records to have 'one-time' plan
UPDATE fees 
SET installment_plan = 'one-time',
    installment_number = 1,
    total_installments = 1
WHERE installment_plan IS NULL;

-- Create index for parent_fee_id for faster queries
CREATE INDEX IF NOT EXISTS idx_fees_parent_fee_id ON fees(parent_fee_id);

-- ============================================================================
-- Helper Function: Create Installment Plan
-- ============================================================================
CREATE OR REPLACE FUNCTION create_fee_installments(
  p_school_id TEXT,
  p_student_id UUID,
  p_fee_type TEXT,
  p_total_amount DECIMAL,
  p_installment_plan TEXT, -- 'monthly' or 'quarterly'
  p_start_date DATE,
  p_label TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_parent_fee_id UUID;
  v_installment_count INTEGER;
  v_installment_amount DECIMAL;
  v_due_date DATE;
  v_label TEXT;
  i INTEGER;
BEGIN
  -- Determine number of installments
  IF p_installment_plan = 'monthly' THEN
    v_installment_count := 12;
  ELSIF p_installment_plan = 'quarterly' THEN
    v_installment_count := 4;
  ELSE
    RAISE EXCEPTION 'Invalid installment plan. Must be monthly or quarterly.';
  END IF;

  -- Calculate installment amount
  v_installment_amount := ROUND(p_total_amount / v_installment_count, 2);

  -- Create parent fee record (for tracking the overall plan)
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
    p_school_id,
    p_student_id,
    p_fee_type,
    p_total_amount,
    p_start_date,
    FALSE,
    p_installment_plan,
    0, -- 0 indicates this is the parent record
    v_installment_count,
    COALESCE(p_label, p_fee_type || ' - ' || p_installment_plan || ' plan'),
    p_created_by
  ) RETURNING id INTO v_parent_fee_id;

  -- Create individual installment records
  FOR i IN 1..v_installment_count LOOP
    -- Calculate due date for this installment
    IF p_installment_plan = 'monthly' THEN
      v_due_date := p_start_date + (i - 1) * INTERVAL '1 month';
    ELSE -- quarterly
      v_due_date := p_start_date + (i - 1) * INTERVAL '3 months';
    END IF;

    -- Generate label for installment
    IF p_installment_plan = 'monthly' THEN
      v_label := p_fee_type || ' - ' || TO_CHAR(v_due_date, 'Month YYYY');
    ELSE
      v_label := p_fee_type || ' - Q' || i || ' ' || TO_CHAR(v_due_date, 'YYYY');
    END IF;

    -- Adjust last installment to account for rounding
    IF i = v_installment_count THEN
      v_installment_amount := p_total_amount - (v_installment_amount * (v_installment_count - 1));
    END IF;

    -- Insert installment record
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
      parent_fee_id,
      label,
      created_by
    ) VALUES (
      p_school_id,
      p_student_id,
      p_fee_type,
      v_installment_amount,
      v_due_date,
      FALSE,
      p_installment_plan,
      i,
      v_installment_count,
      v_parent_fee_id,
      v_label,
      p_created_by
    );
  END LOOP;

  RETURN v_parent_fee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Example Usage:
-- ============================================================================
-- Create monthly installment plan (12 months)
-- SELECT create_fee_installments(
--   'SCHOOL123',                    -- school_id
--   'student-uuid-here',            -- student_id
--   'Tuition',                      -- fee_type
--   70000.00,                       -- total_amount
--   'monthly',                      -- installment_plan
--   '2025-04-01'::DATE,            -- start_date
--   'Annual Tuition Fee 2025-26',  -- label (optional)
--   'admin-uuid-here'               -- created_by (optional)
-- );

-- Create quarterly installment plan (4 quarters)
-- SELECT create_fee_installments(
--   'SCHOOL123',
--   'student-uuid-here',
--   'Tuition',
--   70000.00,
--   'quarterly',
--   '2025-04-01'::DATE,
--   'Annual Tuition Fee 2025-26',
--   'admin-uuid-here'
-- );

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION create_fee_installments TO authenticated;

COMMENT ON FUNCTION create_fee_installments IS 'Creates a fee installment plan (monthly or quarterly) for a student';
