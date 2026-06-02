-- Staff list helper for the single-school app.
-- Run this in Supabase SQL Editor.

create or replace function public.get_staff_profiles()
returns table (
  id uuid,
  full_name text,
  role text
)
security definer
set search_path = public
language sql
as $$
  select
    p.id,
    p.full_name,
    p.role
  from public.profiles p
  where p.role in ('admin', 'principal', 'teacher', 'accountant')
  order by p.role asc, p.full_name asc nulls last;
$$;

grant execute on function public.get_staff_profiles() to authenticated;
