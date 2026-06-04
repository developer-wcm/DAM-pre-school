-- ─── 1. Create student_documents table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_documents (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id     text NOT NULL,
  doc_type      text NOT NULL,   -- e.g. 'birth_cert', 'aadhar_child', 'father_aadhar'
  doc_label     text NOT NULL,   -- human-readable label
  file_name     text NOT NULL,
  file_url      text NOT NULL,   -- public URL from Supabase Storage
  uploaded_at   timestamptz DEFAULT now(),
  uploaded_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── 2. Enable Row Level Security ─────────────────────────────────────────────
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- Admins/teachers in the same school can read & write
CREATE POLICY "school_members_manage_documents"
ON student_documents
FOR ALL
USING (
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  )
);

-- ─── 3. Storage bucket (run in Supabase dashboard > Storage > New bucket) ─────
-- Or run via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow authenticated users from same school to upload/read
CREATE POLICY "school_members_upload_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "school_members_read_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'student-documents');

CREATE POLICY "school_members_delete_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'student-documents');
