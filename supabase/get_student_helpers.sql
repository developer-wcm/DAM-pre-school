-- Student list and attendance helpers for the single-school app.
-- Run this in Supabase SQL Editor.

create or replace function public.get_student_profiles()
returns table (
  id uuid,
  full_name text,
  class text,
  roll_number text,
  status text
)
security definer
set search_path = public
language sql
as $$
  select
    s.id,
    s.full_name,
    s.class,
    s.roll_number,
    coalesce(s.status, 'active') as status
  from public.students s
  where coalesce(s.status, 'active') = 'active'
  order by s.class asc nulls last, s.roll_number asc nulls last, s.full_name asc;
$$;

grant execute on function public.get_student_profiles() to authenticated;

create or replace function public.get_student_attendance_range(
  p_start_date date,
  p_end_date date
)
returns table (
  student_id uuid,
  date date,
  status text
)
security definer
set search_path = public
language sql
as $$
  select
    a.student_id,
    a.date,
    a.status
  from public.attendance a
  where a.date >= p_start_date
    and a.date <= p_end_date
  order by a.date asc;
$$;

grant execute on function public.get_student_attendance_range(date, date) to authenticated;
