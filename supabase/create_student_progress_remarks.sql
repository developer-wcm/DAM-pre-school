-- Student progress tracking + parent/teacher remarks.
-- Backs: app/(teacher)/progress.tsx, app/(teacher)/progress-report.tsx,
-- app/(teacher)/index.tsx, app/(parent)/index.tsx, app/(dashboard)/student-profile.tsx

-- ============================================================================
-- 1. STUDENT_PROGRESS — one row per student per term, holds the skill checklist
-- ============================================================================
create table if not exists public.student_progress (
  id                 uuid        primary key default gen_random_uuid(),
  student_id         uuid        not null references public.students(id) on delete cascade,
  term               text        not null check (term in ('term1','term2','term3')),
  skills             jsonb       not null default '[]'::jsonb,
  observation_notes  text,
  updated_by         uuid        references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (student_id, term)
);

create index if not exists student_progress_student_idx on public.student_progress (student_id);

alter table public.student_progress enable row level security;

drop policy if exists "Admin manages all progress" on public.student_progress;
create policy "Admin manages all progress"
  on public.student_progress
  for all
  using (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_progress.student_id
      where p.id = auth.uid()
        and p.school_id = s.school_id
        and p.role in ('admin', 'principal')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_progress.student_id
      where p.id = auth.uid()
        and p.school_id = s.school_id
        and p.role in ('admin', 'principal')
    )
  );

drop policy if exists "Teacher manages own class progress" on public.student_progress;
create policy "Teacher manages own class progress"
  on public.student_progress
  for all
  using (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_progress.student_id
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = s.school_id
        and p.assigned_class = s.class
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_progress.student_id
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = s.school_id
        and p.assigned_class = s.class
    )
  );

drop policy if exists "Parent views own child progress" on public.student_progress;
create policy "Parent views own child progress"
  on public.student_progress
  for select
  using (
    exists (
      select 1 from public.students s
      where s.id = student_progress.student_id
        and s.parent_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. STUDENT_REMARKS — free-text notes sent to a student's parent
-- ============================================================================
create table if not exists public.student_remarks (
  id           uuid        primary key default gen_random_uuid(),
  student_id   uuid        not null references public.students(id) on delete cascade,
  school_id    text,
  sent_by      uuid        references public.profiles(id) on delete set null,
  sender_name  text,
  sender_role  text,
  message      text        not null,
  is_read      boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists student_remarks_student_idx on public.student_remarks (student_id, created_at desc);

alter table public.student_remarks enable row level security;

drop policy if exists "Admin manages all remarks" on public.student_remarks;
create policy "Admin manages all remarks"
  on public.student_remarks
  for all
  using (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_remarks.student_id
      where p.id = auth.uid()
        and p.school_id = s.school_id
        and p.role in ('admin', 'principal')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_remarks.student_id
      where p.id = auth.uid()
        and p.school_id = s.school_id
        and p.role in ('admin', 'principal')
    )
  );

drop policy if exists "Teacher sends remarks for own class" on public.student_remarks;
create policy "Teacher sends remarks for own class"
  on public.student_remarks
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_remarks.student_id
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = s.school_id
        and p.assigned_class = s.class
    )
  );

drop policy if exists "Teacher views own class remarks" on public.student_remarks;
create policy "Teacher views own class remarks"
  on public.student_remarks
  for select
  using (
    exists (
      select 1 from public.profiles p
      join public.students s on s.id = student_remarks.student_id
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = s.school_id
        and p.assigned_class = s.class
    )
  );

drop policy if exists "Parent views own child remarks" on public.student_remarks;
create policy "Parent views own child remarks"
  on public.student_remarks
  for select
  using (
    exists (
      select 1 from public.students s
      where s.id = student_remarks.student_id
        and s.parent_id = auth.uid()
    )
  );

-- Parents mark their child's remarks as read (app/(parent)/index.tsx does
-- .update({ is_read: true }) filtered by student_id + is_read=false).
drop policy if exists "Parent marks own child remarks read" on public.student_remarks;
create policy "Parent marks own child remarks read"
  on public.student_remarks
  for update
  using (
    exists (
      select 1 from public.students s
      where s.id = student_remarks.student_id
        and s.parent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_remarks.student_id
        and s.parent_id = auth.uid()
    )
  );
