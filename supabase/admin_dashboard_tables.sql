-- ============================================================================
-- ADMIN DASHBOARD TABLES
-- Complete database schema for admin home page functionality
-- ============================================================================

-- ============================================================================
-- 1. STUDENTS TABLE
-- Stores student information and class assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(join_code) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  class TEXT NOT NULL, -- e.g., 'PG', 'PKG', 'JKG', 'SKG'
  roll_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);

-- ============================================================================
-- 2. ATTENDANCE TABLE
-- Daily attendance tracking for students
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(join_code) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half-day', 'sick-leave', 'excused', 'holiday')),
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date) -- One attendance record per student per day
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- ============================================================================
-- 3. FEES TABLE
-- Fee management and payment tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(join_code) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL, -- e.g., 'tuition', 'transport', 'activity', 'annual'
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT, -- e.g., 'cash', 'card', 'upi', 'bank_transfer'
  transaction_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_fees_school_id ON fees(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_paid ON fees(paid);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON fees(due_date);

-- ============================================================================
-- 4. HOLIDAYS TABLE
-- School holiday calendar
-- ============================================================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(join_code) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Diwali', 'Summer Break', 'Independence Day'
  date DATE NOT NULL, -- Start date
  date_to DATE, -- End date (for multi-day holidays)
  days INTEGER DEFAULT 1, -- Number of days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'holidays' AND column_name = 'type'
  ) THEN
    ALTER TABLE holidays ADD COLUMN type TEXT DEFAULT 'public';
  END IF;
  
  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'holidays' AND column_name = 'description'
  ) THEN
    ALTER TABLE holidays ADD COLUMN description TEXT;
  END IF;
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_holidays_school_id ON holidays(school_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- ============================================================================
-- 5. ACTIVITY LOG TABLE
-- Recent activity feed for dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(join_code) ON DELETE CASCADE,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  title TEXT NOT NULL, -- e.g., 'New Student Enrolled'
  subtitle TEXT NOT NULL, -- e.g., 'Rahul Kumar joined Class PG'
  color TEXT DEFAULT '#E8F4FB', -- Background color for icon
  dot_color TEXT DEFAULT '#3AAF72', -- Status dot color
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_school_id ON activity_log(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================================================
-- 6. SECURITY DEFINER FUNCTIONS
-- Functions to safely query data across user boundaries
-- ============================================================================

-- Function to get pending profiles (unapproved users)
CREATE OR REPLACE FUNCTION get_pending_profiles(p_school_id TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.role,
    p.created_at
  FROM profiles p
  WHERE p.school_id = p_school_id
    AND p.approved = FALSE
    AND p.role != 'admin'
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to approve a profile
CREATE OR REPLACE FUNCTION approve_profile(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET approved = TRUE
  WHERE id = p_user_id;
END;
$$;

-- Function to reject a profile (delete user)
CREATE OR REPLACE FUNCTION reject_profile(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete from auth.users (cascades to profiles)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- ============================================================================
-- 7. DEMO DATA
-- Sample data for testing the admin dashboard
-- ============================================================================

-- Insert demo students
INSERT INTO students (school_id, full_name, class, roll_number, date_of_birth, gender, admission_date, status)
VALUES
  ('DEM001', 'Aarav Sharma', 'PG', 'PG001', '2021-05-15', 'male', '2024-04-01', 'active'),
  ('DEM001', 'Ananya Patel', 'PG', 'PG002', '2021-06-20', 'female', '2024-04-01', 'active'),
  ('DEM001', 'Vivaan Kumar', 'PG', 'PG003', '2021-07-10', 'male', '2024-04-01', 'active'),
  ('DEM001', 'Diya Singh', 'PKG', 'PKG001', '2020-08-12', 'female', '2023-04-01', 'active'),
  ('DEM001', 'Arjun Reddy', 'PKG', 'PKG002', '2020-09-25', 'male', '2023-04-01', 'active'),
  ('DEM001', 'Ishita Verma', 'PKG', 'PKG003', '2020-10-30', 'female', '2023-04-01', 'active'),
  ('DEM001', 'Reyansh Gupta', 'JKG', 'JKG001', '2019-11-05', 'male', '2022-04-01', 'active'),
  ('DEM001', 'Saanvi Joshi', 'JKG', 'JKG002', '2019-12-18', 'female', '2022-04-01', 'active'),
  ('DEM001', 'Aditya Mehta', 'SKG', 'SKG001', '2018-01-22', 'male', '2021-04-01', 'active'),
  ('DEM001', 'Kiara Nair', 'SKG', 'SKG002', '2018-02-14', 'female', '2021-04-01', 'active')
ON CONFLICT DO NOTHING;

-- Insert today's attendance (80% present)
INSERT INTO attendance (school_id, student_id, date, status)
SELECT 
  'DEM001',
  id,
  CURRENT_DATE,
  CASE 
    WHEN random() < 0.8 THEN 'present'
    WHEN random() < 0.9 THEN 'absent'
    ELSE 'late'
  END
FROM students
WHERE school_id = 'DEM001'
ON CONFLICT (student_id, date) DO NOTHING;

-- Insert pending fees
INSERT INTO fees (school_id, student_id, fee_type, amount, due_date, paid, paid_amount)
SELECT 
  'DEM001',
  id,
  'tuition',
  5000.00,
  CURRENT_DATE + INTERVAL '15 days',
  FALSE,
  0
FROM students
WHERE school_id = 'DEM001' AND class IN ('PG', 'PKG')
ON CONFLICT DO NOTHING;

-- Insert some overdue fees
INSERT INTO fees (school_id, student_id, fee_type, amount, due_date, paid, paid_amount)
SELECT 
  'DEM001',
  id,
  'activity',
  1500.00,
  CURRENT_DATE - INTERVAL '10 days',
  FALSE,
  0
FROM students
WHERE school_id = 'DEM001' AND class IN ('JKG', 'SKG')
LIMIT 3
ON CONFLICT DO NOTHING;

-- Insert holidays
INSERT INTO holidays (school_id, name, date, date_to, days, type, description)
VALUES
  ('DEM001', 'Republic Day', '2026-01-26', '2026-01-26', 1, 'public', 'National holiday celebrating the adoption of the Constitution'),
  ('DEM001', 'Holi', '2026-03-14', '2026-03-15', 2, 'public', 'Festival of colors'),
  ('DEM001', 'Summer Break', '2026-05-15', '2026-06-30', 47, 'school', 'Annual summer vacation'),
  ('DEM001', 'Independence Day', '2026-08-15', '2026-08-15', 1, 'public', 'National holiday celebrating independence'),
  ('DEM001', 'Diwali', '2026-11-01', '2026-11-05', 5, 'public', 'Festival of lights')
ON CONFLICT DO NOTHING;

-- Insert activity log entries
INSERT INTO activity_log (school_id, icon, title, subtitle, color, dot_color)
VALUES
  ('DEM001', '👋', 'New Student Enrolled', 'Aarav Sharma joined Class PG', '#E8F4FB', '#3AAF72'),
  ('DEM001', '💰', 'Fee Payment Received', 'Ananya Patel paid ₹5,000 tuition fee', '#FFF0D4', '#D4822A'),
  ('DEM001', '✅', 'Attendance Marked', 'Class PKG attendance completed for today', '#D4F4E8', '#2A9D6E'),
  ('DEM001', '📢', 'Announcement Posted', 'Sports Day scheduled for next Friday', '#E8E4F8', '#7B6FE8'),
  ('DEM001', '👨‍🏫', 'Teacher Approved', 'Priya Sharma joined as teacher', '#D4F4E8', '#2A9D6E')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Secure access to tables based on user role and school
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Users can view students from their school"
  ON students FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/Principal can insert students"
  ON students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = students.school_id
      AND role IN ('admin', 'principal')
    )
  );

CREATE POLICY "Admin/Principal can update students"
  ON students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = students.school_id
      AND role IN ('admin', 'principal')
    )
  );

-- Attendance policies
CREATE POLICY "Users can view attendance from their school"
  ON attendance FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers/Admin can mark attendance"
  ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = attendance.school_id
      AND role IN ('admin', 'principal', 'teacher')
      AND approved = true
    )
  );

CREATE POLICY "Teachers/Admin can update attendance"
  ON attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = attendance.school_id
      AND role IN ('admin', 'principal', 'teacher')
      AND approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = attendance.school_id
      AND role IN ('admin', 'principal', 'teacher')
      AND approved = true
    )
  );

CREATE POLICY "Teachers/Admin can delete attendance"
  ON attendance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = attendance.school_id
      AND role IN ('admin', 'principal', 'teacher')
      AND approved = true
    )
  );

-- Fees policies
CREATE POLICY "Users can view fees from their school"
  ON fees FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/Accountant can manage fees"
  ON fees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = fees.school_id
      AND role IN ('admin', 'principal', 'accountant')
    )
  );

-- Holidays policies
CREATE POLICY "Users can view holidays from their school"
  ON holidays FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/Principal can manage holidays"
  ON holidays FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = holidays.school_id
      AND role IN ('admin', 'principal')
    )
  );

-- Activity log policies
CREATE POLICY "Users can view activity from their school"
  ON activity_log FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/Principal can create activity"
  ON activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND school_id = activity_log.school_id
      AND role IN ('admin', 'principal')
    )
  );

-- ============================================================================
-- 9. TRIGGERS
-- Automatic timestamp updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETE
-- Run this script in Supabase SQL Editor to create all admin dashboard tables
-- ============================================================================
