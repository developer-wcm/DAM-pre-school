-- Dashboard helpers for the single-school app.
-- Run this in Supabase SQL Editor.

create or replace function public.get_dashboard_pending_fees()
returns table (
  amount numeric,
  paid boolean,
  due_date date
)
security definer
set search_path = public
language sql
as $$
  select
    f.amount,
    f.paid,
    f.due_date
  from public.fees f
  where coalesce(f.paid, false) = false;
$$;

grant execute on function public.get_dashboard_pending_fees() to authenticated;

create or replace function public.get_dashboard_activity()
returns table (
  id uuid,
  icon text,
  title text,
  subtitle text,
  color text,
  dot_color text
)
security definer
set search_path = public
language sql
as $$
  select
    a.id,
    a.icon,
    a.title,
    a.subtitle,
    a.color,
    a.dot_color
  from public.activity_log a
  order by a.created_at desc
  limit 5;
$$;

grant execute on function public.get_dashboard_activity() to authenticated;

create or replace function public.get_dashboard_next_holiday(p_today date)
returns table (
  name text,
  date date,
  date_to date,
  days integer
)
security definer
set search_path = public
language sql
as $$
  select
    h.name,
    h.date,
    h.date_to,
    h.days
  from public.holidays h
  where coalesce(h.date_to, h.date) >= p_today
  order by h.date asc
  limit 1;
$$;

grant execute on function public.get_dashboard_next_holiday(date) to authenticated;
