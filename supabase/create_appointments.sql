-- Appointments table — parent-teacher meeting requests

create table if not exists public.appointments (
  id                 uuid        primary key default gen_random_uuid(),
  school_id          text        not null,
  parent_id          uuid        references public.profiles(id) on delete set null,
  parent_name        text        not null,
  teacher_id         uuid        references public.profiles(id) on delete set null,
  teacher_name       text        not null,
  student_name       text        not null default '',
  date               date        not null,
  time_slot          text        not null,
  topic              text        not null default '',
  status             text        not null default 'requested'
                                 check (status in ('requested','confirmed','rescheduled','cancelled','completed')),
  notes              text,
  reschedule_reason  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists appointments_school_date_idx on public.appointments (school_id, date);

alter table public.appointments enable row level security;

-- Admin/principal can see and manage all appointments in their school
create policy "Admin manages appointments"
  on public.appointments
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and school_id = appointments.school_id
        and role in ('admin', 'principal')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and school_id = appointments.school_id
        and role in ('admin', 'principal')
    )
  );

-- Parents can see and create their own appointments
create policy "Parent manages own appointments"
  on public.appointments
  for all
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

-- Teachers can see appointments assigned to them
create policy "Teacher views own appointments"
  on public.appointments
  for select
  using (teacher_id = auth.uid());
