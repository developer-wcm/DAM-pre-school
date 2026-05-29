-- ============================================================
-- FIX: Attendance RLS + holiday status + upsert support
-- Run in Supabase SQL Editor (after admin_dashboard_tables.sql)
-- ============================================================

-- Allow "holiday" as a stored attendance status (for calendar H marks)
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_status_check
  CHECK (
    status IN (
      'present',
      'absent',
      'late',
      'half-day',
      'sick-leave',
      'excused',
      'holiday'
    )
  );

-- SELECT (may already exist)
DROP POLICY IF EXISTS "Users can view attendance from their school" ON public.attendance;
CREATE POLICY "Users can view attendance from their school"
  ON public.attendance FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- INSERT
DROP POLICY IF EXISTS "Teachers/Admin can mark attendance" ON public.attendance;
CREATE POLICY "Teachers/Admin can mark attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND school_id = attendance.school_id
        AND role IN ('admin', 'principal', 'teacher')
        AND approved = true
    )
  );

-- UPDATE (required for upsert on conflict)
DROP POLICY IF EXISTS "Teachers/Admin can update attendance" ON public.attendance;
CREATE POLICY "Teachers/Admin can update attendance"
  ON public.attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND school_id = attendance.school_id
        AND role IN ('admin', 'principal', 'teacher')
        AND approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND school_id = attendance.school_id
        AND role IN ('admin', 'principal', 'teacher')
        AND approved = true
    )
  );

-- DELETE (clearing a day in student profile edit)
DROP POLICY IF EXISTS "Teachers/Admin can delete attendance" ON public.attendance;
CREATE POLICY "Teachers/Admin can delete attendance"
  ON public.attendance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND school_id = attendance.school_id
        AND role IN ('admin', 'principal', 'teacher')
        AND approved = true
    )
  );
