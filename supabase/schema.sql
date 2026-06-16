-- ============================================================
-- FULL SCHEMA — Run in Supabase SQL Editor
-- ============================================================

-- 1. SCHOOLS TABLE
create table if not exists public.schools (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  join_code    text unique not null,
  created_at   timestamptz default now()
);

alter table public.schools enable row level security;

drop policy if exists "Authenticated users can view schools" on public.schools;
create policy "Authenticated users can view schools"
  on public.schools for select
  using (true);

drop policy if exists "Admin can insert schools" on public.schools;
create policy "Admin can insert schools"
  on public.schools for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin can update schools" on public.schools;
create policy "Admin can update schools"
  on public.schools for update
  using (auth.role() = 'authenticated');

-- 2. STUDENTS TABLE
create table if not exists public.students (
  id           uuid primary key default gen_random_uuid(),
  school_id    text not null,
  full_name    text not null,
  class        text,
  parent_id    uuid references public.profiles(id),
  created_at   timestamptz default now()
);

alter table public.students enable row level security;

drop policy if exists "Authenticated users can view students" on public.students;
create policy "Authenticated users can view students"
  on public.students for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage students" on public.students;
create policy "Admin can manage students"
  on public.students for all
  using (auth.role() = 'authenticated');

-- 3. ATTENDANCE TABLE
create table if not exists public.attendance (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references public.students(id) on delete cascade,
  school_id    text not null,
  date         date not null default current_date,
  status       text check (status in ('present', 'absent', 'late')) not null,
  created_at   timestamptz default now(),
  unique(student_id, date)
);

alter table public.attendance enable row level security;

drop policy if exists "Authenticated users can view attendance" on public.attendance;
create policy "Authenticated users can view attendance"
  on public.attendance for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin/Teacher can manage attendance" on public.attendance;
create policy "Admin/Teacher can manage attendance"
  on public.attendance for all
  using (auth.role() = 'authenticated');

-- 3b. STAFF ATTENDANCE TABLE
-- Staff attendance is kept separate from student attendance because staff are
-- in `profiles`, not `students`. Used by the admin Staff Attendance screen and
-- the teacher WiFi auto check-in on the Profile tab.
create table if not exists public.staff_attendance (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid references public.profiles(id) on delete cascade,
  school_id    text not null,
  date         date not null default current_date,
  status       text check (status in ('present', 'absent', 'late')) not null,
  marked_by    uuid references public.profiles(id),
  notes        text,
  created_at   timestamptz default now(),
  unique(staff_id, date)
);

alter table public.staff_attendance enable row level security;

drop policy if exists "school staff can view staff attendance" on public.staff_attendance;
create policy "school staff can view staff attendance"
  on public.staff_attendance for select
  using (school_id in (
    select school_id from public.profiles where id = auth.uid()
  ));

drop policy if exists "admins can manage staff attendance" on public.staff_attendance;
create policy "admins can manage staff attendance"
  on public.staff_attendance for all
  using (school_id in (
    select school_id from public.profiles
    where id = auth.uid() and role in ('admin', 'principal', 'teacher')
  ))
  with check (school_id in (
    select school_id from public.profiles
    where id = auth.uid() and role in ('admin', 'principal', 'teacher')
  ));

-- 4. FEES TABLE
create table if not exists public.fees (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references public.students(id) on delete cascade,
  school_id    text not null,
  amount       numeric(10,2) not null,
  paid         boolean not null default false,
  due_date     date,
  paid_date    date,
  description  text,
  created_at   timestamptz default now()
);

alter table public.fees enable row level security;

drop policy if exists "Authenticated users can view fees" on public.fees;
create policy "Authenticated users can view fees"
  on public.fees for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin/Accountant can manage fees" on public.fees;
create policy "Admin/Accountant can manage fees"
  on public.fees for all
  using (auth.role() = 'authenticated');

-- 5. HOLIDAYS TABLE
create table if not exists public.holidays (
  id         uuid primary key default gen_random_uuid(),
  school_id  text not null,
  name       text not null,
  date       date not null,
  date_to    date,
  days       int not null default 1,
  created_at timestamptz default now()
);

alter table public.holidays enable row level security;

drop policy if exists "Authenticated users can view holidays" on public.holidays;
create policy "Authenticated users can view holidays"
  on public.holidays for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage holidays" on public.holidays;
create policy "Admin can manage holidays"
  on public.holidays for all
  using (auth.role() = 'authenticated');

-- 6. ACTIVITY LOG TABLE
create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  school_id    text not null,
  icon         text not null default '📌',
  title        text not null,
  subtitle     text,
  color        text default '#E8E4F8',
  dot_color    text default '#7B6FE8',
  created_at   timestamptz default now()
);

alter table public.activity_log enable row level security;

drop policy if exists "Authenticated users can view activity" on public.activity_log;
create policy "Authenticated users can view activity"
  on public.activity_log for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert activity" on public.activity_log;
create policy "Authenticated users can insert activity"
  on public.activity_log for insert
  with check (auth.role() = 'authenticated');
