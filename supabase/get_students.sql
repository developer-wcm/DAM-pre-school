-- ============================================================
-- GET STUDENTS FOR ADMIN PAGE
-- ============================================================

-- 1. GET ALL STUDENTS WITH PARENT INFO
SELECT 
    s.id,
    s.full_name,
    s.class,
    s.roll_number,
    s.date_of_birth,
    s.gender,
    s.status,
    s.admission_date,
    s.school_id,
    p.full_name as parent_name,
    p.email as parent_email,
    p.phone as parent_phone,
    s.created_at,
    s.updated_at
FROM public.students s
LEFT JOIN public.profiles p ON s.parent_id = p.id
WHERE s.school_id = 'DEM001'  -- Replace with actual school_id
ORDER BY s.full_name;

-- ============================================================
-- 2. GET STUDENTS COUNT BY CLASS
-- ============================================================
SELECT 
    class,
    COUNT(*) as total_students,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_students,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_students
FROM public.students
WHERE school_id = 'DEM001'
GROUP BY class
ORDER BY class;

-- ============================================================
-- 3. GET STUDENTS WITH ATTENDANCE SUMMARY
-- ============================================================
SELECT 
    s.id,
    s.full_name,
    s.class,
    s.roll_number,
    s.status,
    COUNT(a.id) as total_attendance_records,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as days_present,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as days_absent,
    SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as days_late,
    ROUND(
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric / 
        NULLIF(COUNT(a.id), 0) * 100, 
        2
    ) as attendance_percentage
FROM public.students s
LEFT JOIN public.attendance a ON s.id = a.student_id
WHERE s.school_id = 'DEM001'
GROUP BY s.id, s.full_name, s.class, s.roll_number, s.status
ORDER BY s.full_name;

-- ============================================================
-- 4. GET STUDENTS WITH FEE STATUS
-- ============================================================
SELECT 
    s.id,
    s.full_name,
    s.class,
    s.roll_number,
    s.status,
    COUNT(f.id) as total_fees,
    SUM(f.amount) as total_fee_amount,
    SUM(CASE WHEN f.paid = true THEN 1 ELSE 0 END) as fees_paid,
    SUM(CASE WHEN f.paid = false THEN 1 ELSE 0 END) as fees_pending,
    SUM(f.amount) FILTER (WHERE f.paid = false) as pending_amount
FROM public.students s
LEFT JOIN public.fees f ON s.id = f.student_id
WHERE s.school_id = 'DEM001'
GROUP BY s.id, s.full_name, s.class, s.roll_number, s.status
ORDER BY s.full_name;

-- ============================================================
-- 5. GET STUDENTS FILTERED BY CLASS
-- ============================================================
SELECT 
    s.id,
    s.full_name,
    s.class,
    s.roll_number,
    s.date_of_birth,
    s.gender,
    s.status,
    s.admission_date,
    p.full_name as parent_name,
    p.phone as parent_phone
FROM public.students s
LEFT JOIN public.profiles p ON s.parent_id = p.id
WHERE s.school_id = 'DEM001' 
  AND s.class = 'JKG'  -- Replace with desired class
  AND s.status = 'active'  -- Only active students
ORDER BY s.roll_number;

-- ============================================================
-- 6. GET NEW STUDENTS (RECENT ADMISSIONS)
-- ============================================================
SELECT 
    s.id,
    s.full_name,
    s.class,
    s.admission_date,
    s.status,
    p.full_name as parent_name,
    p.email as parent_email,
    p.phone as parent_phone
FROM public.students s
LEFT JOIN public.profiles p ON s.parent_id = p.id
WHERE s.school_id = 'DEM001'
  AND s.admission_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY s.admission_date DESC;

-- ============================================================
-- 7. GET STUDENT DETAIL VIEW (for individual student page)
-- ============================================================
SELECT 
    s.id,
    s.full_name,
    s.class,
    s.roll_number,
    s.date_of_birth,
    s.gender,
    s.status,
    s.admission_date,
    s.school_id,
    p.id as parent_id,
    p.full_name as parent_name,
    p.email as parent_email,
    p.phone as parent_phone,
    p.address as parent_address,
    (SELECT COUNT(*) FROM public.attendance 
     WHERE student_id = s.id AND status = 'present') as total_present,
    (SELECT COUNT(*) FROM public.attendance 
     WHERE student_id = s.id AND status = 'absent') as total_absent,
    (SELECT COUNT(*) FROM public.fees 
     WHERE student_id = s.id AND paid = false) as pending_fees_count,
    (SELECT SUM(amount) FROM public.fees 
     WHERE student_id = s.id AND paid = false) as pending_fees_amount
FROM public.students s
LEFT JOIN public.profiles p ON s.parent_id = p.id
WHERE s.id = 'YOUR_STUDENT_ID'  -- Replace with actual student_id
LIMIT 1;

-- ============================================================
-- 8. USEFUL INDEXES FOR ADMIN PAGE QUERIES
-- ============================================================
-- These indexes should already exist but ensure they do
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_admission_date ON public.students(admission_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);
