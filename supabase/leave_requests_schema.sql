-- ============================================================
-- LEAVE REQUESTS TABLE
-- Run this in Supabase SQL Editor before using the screen
-- ============================================================

create table if not exists public.leave_requests (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid references public.profiles(id) on delete cascade,
  school_id   text not null,
  leave_type  text not null check (leave_type in ('sick', 'casual', 'emergency', 'annual', 'maternity', 'other')),
  start_date  date not null,
  end_date    date not null,
  days        int not null default 1,
  reason      text,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz default now()
);

alter table public.leave_requests enable row level security;

drop policy if exists "Authenticated users can view leave requests" on public.leave_requests;
create policy "Authenticated users can view leave requests"
  on public.leave_requests for select
  using (auth.role() = 'authenticated');

drop policy if exists "Staff can insert own leave requests" on public.leave_requests;
create policy "Staff can insert own leave requests"
  on public.leave_requests for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin can update leave requests" on public.leave_requests;
create policy "Admin can update leave requests"
  on public.leave_requests for update
  using (auth.role() = 'authenticated');

drop policy if exists "Admin can delete leave requests" on public.leave_requests;
create policy "Admin can delete leave requests"
  on public.leave_requests for delete
  using (auth.role() = 'authenticated');

-- Index for fast lookups
create index if not exists idx_leave_requests_school on public.leave_requests(school_id);
create index if not exists idx_leave_requests_staff on public.leave_requests(staff_id);
create index if not exists idx_leave_requests_status on public.leave_requests(status);

-- ============================================================
-- OPTIONAL: seed some demo data
-- ============================================================
-- insert into public.leave_requests (staff_id, school_id, leave_type, start_date, end_date, days, reason, status)
-- values
--   ('<teacher_uuid>', 'DEMO01', 'sick', '2026-02-12', '2026-02-14', 3, 'Fever and doctor advised rest.', 'pending'),
--   ('<teacher_uuid>', 'DEMO01', 'casual', '2026-01-05', '2026-01-06', 2, null, 'approved'),
--   ('<staff_uuid>',   'DEMO01', 'emergency', '2025-12-28', '2025-12-28', 1, null, 'rejected');
