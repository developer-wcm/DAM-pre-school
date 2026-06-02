-- First, let's check if RLS is enabled on fees table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'fees';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'fees';

-- Enable RLS on fees table if not enabled
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON fees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON fees;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON fees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON fees;

-- Create new policies for fees table
-- Allow all authenticated users to read fees from their school
CREATE POLICY "Enable read access for authenticated users" ON fees
  FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow admin/principal to insert fees
CREATE POLICY "Enable insert for authenticated users" ON fees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'principal', 'accountant')
    )
  );

-- Allow admin/principal to update fees
CREATE POLICY "Enable update for authenticated users" ON fees
  FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'principal', 'accountant')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'principal', 'accountant')
    )
  );

-- Allow admin/principal to delete fees
CREATE POLICY "Enable delete for authenticated users" ON fees
  FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'principal', 'accountant')
    )
  );

-- Verify fees exist in database
SELECT COUNT(*) as total_fees, school_id, installment_plan
FROM fees
GROUP BY school_id, installment_plan;
