-- ============================================================
-- CREATE CLASSES TABLE
-- ============================================================

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    class_id TEXT NOT NULL UNIQUE,  -- e.g., 'PG2024', 'JKG024'
    school_id TEXT NOT NULL,
    teacher_id TEXT,
    capacity INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert demo classes for DAM PreSchool
INSERT INTO public.classes (name, level, class_id, school_id, capacity) VALUES
('Play Group', 'play-group', 'PG2024', 'DEMO01', 25),
('Pre-KG', 'pre-kg', 'PKG024', 'DEMO01', 30),
('Junior KG', 'junior-kg', 'JKG024', 'DEMO01', 30),
('Senior KG', 'senior-kg', 'SKG024', 'DEMO01', 30)
ON CONFLICT (class_id) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    school_id = EXCLUDED.school_id;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);

-- Verify classes
SELECT * FROM public.classes ORDER BY level;