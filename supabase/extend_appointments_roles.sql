-- Extends the parent-teacher `appointments` table to also support:
--   parent <-> admin/principal
--   teacher <-> admin/principal
-- The existing parent_id/parent_name/teacher_id/teacher_name columns are
-- reused as "the parent in this meeting" / "the teacher in this meeting" —
-- one or the other may now be empty depending on meeting_type.

alter table public.appointments
  alter column parent_name  drop not null,
  alter column teacher_name drop not null;

alter table public.appointments
  add column if not exists meeting_type   text not null default 'parent_teacher'
    check (meeting_type in ('parent_teacher', 'parent_admin', 'teacher_admin')),
  add column if not exists requester_role text not null default 'parent'
    check (requester_role in ('parent', 'teacher', 'admin', 'principal')),
  add column if not exists scheduled_by   uuid references public.profiles(id) on delete set null;

create index if not exists appointments_meeting_type_idx on public.appointments (meeting_type);

-- Teachers previously could only SELECT their own meetings. They now also
-- need to request meetings with admin (insert), and confirm/reschedule/
-- add notes/cancel meetings parents booked with them (update) — same
-- capability admins already have over the whole school's appointments.
drop policy if exists "Teacher views own appointments" on public.appointments;
drop policy if exists "Teacher manages own appointments" on public.appointments;
create policy "Teacher manages own appointments"
  on public.appointments
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
