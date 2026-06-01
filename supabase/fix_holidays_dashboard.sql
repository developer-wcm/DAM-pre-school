-- ============================================================
-- FIX: Dashboard holiday lookup
-- Run this once in Supabase SQL Editor.
-- ============================================================

alter table public.holidays
  add column if not exists date_to date,
  add column if not exists days int not null default 1;

-- Keep the demo school holiday calendar present without creating duplicates.
insert into public.holidays (school_id, name, date, date_to, days)
select *
from (
  values
    ('DEM001', 'Ganesh Chaturthi',             '2026-09-14'::date, '2026-09-14'::date, 1),
    ('DEM001', 'Gandhi Jayanthi',              '2026-10-02'::date, '2026-10-02'::date, 1),
    ('DEM001', 'Term 1 Break',                 '2026-10-19'::date, '2026-10-23'::date, 5),
    ('DEM001', 'Annual Prayer Conference',     '2026-10-30'::date, '2026-10-30'::date, 1),
    ('DEM001', 'Tentative Holiday',            '2026-11-02'::date, '2026-11-02'::date, 1),
    ('DEM001', 'Diwali Holidays',              '2026-11-09'::date, '2026-11-10'::date, 2),
    ('DEM001', 'Kanakadasa Jayanti',           '2026-11-27'::date, '2026-11-27'::date, 1),
    ('DEM001', 'Term 2 Break / Christmas',     '2026-12-21'::date, '2026-12-31'::date, 9),
    ('DEM001', 'New Year',                     '2027-01-01'::date, '2027-01-01'::date, 1),
    ('DEM001', 'Uttarayan (Makara Sankranti)', '2027-01-14'::date, '2027-01-14'::date, 1),
    ('DEM001', 'Republic Day',                 '2027-01-26'::date, '2027-01-26'::date, 1),
    ('DEM001', 'Summer Holidays',              '2027-03-22'::date, '2027-05-25'::date, 65)
) as incoming(school_id, name, date, date_to, days)
where not exists (
  select 1
  from public.holidays h
  where h.school_id = incoming.school_id
    and h.name = incoming.name
    and h.date = incoming.date
);

alter table public.holidays enable row level security;

drop policy if exists "Authenticated users can view holidays" on public.holidays;
drop policy if exists "Users can view holidays from their school" on public.holidays;
create policy "Users can view holidays from their school"
  on public.holidays for select
  using (
    auth.role() = 'authenticated'
    and school_id in (
      select p.school_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

-- Security definer lets the dashboard read the next holiday even if direct table
-- reads are limited by profile RLS. It still scopes results to the user's school.
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
  where h.school_id = coalesce(
    (select p.school_id from public.profiles p where p.id = auth.uid()),
    'DEM001'
  )
    and coalesce(h.date_to, h.date) >= p_today
  order by h.date asc
  limit 1;
$$;

grant execute on function public.get_dashboard_next_holiday(date) to authenticated;

-- Verify. On 2026-06-01 this should return Ganesh Chaturthi.
select *
from public.get_dashboard_next_holiday(current_date);
