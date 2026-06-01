-- ============================================================
-- FIX: RLS policies for profiles + schools tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can upsert own profile" on public.profiles;
drop policy if exists "Allow profile insert" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Allow profile insert"
  on public.profiles for insert
  with check (true);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  school_id text;
  verification_code text;
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'parent');
  
  -- Set school_id, default to DEM001 if not provided
  school_id := coalesce(new.raw_user_meta_data->>'school_id', 'DEM001');
  
  -- Set verification code based on role
  if user_role = 'teacher' then
    verification_code := '654321';
  elsif user_role = 'parent' then
    verification_code := '123456';
  else
    verification_code := lpad(floor(random() * 1000000)::text, 6, '0');
  end if;
  
  insert into public.profiles (id, full_name, role, school_id, approved, verification_code, code_expires_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    user_role,
    school_id,
    false,
    verification_code,
    now() + interval '1 year'
  )
  on conflict (id) do update
    set
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role      = coalesce(excluded.role, public.profiles.role),
      school_id = coalesce(excluded.school_id, public.profiles.school_id),
      verification_code = coalesce(excluded.verification_code, public.profiles.verification_code),
      code_expires_at = coalesce(excluded.code_expires_at, public.profiles.code_expires_at);
  return new;
end;
$$ language plpgsql security definer;

-- ── SCHOOLS ──────────────────────────────────────────────────

-- Allow all users to read schools (needed for join code lookup + dashboard)
drop policy if exists "Authenticated users can view schools" on public.schools;
create policy "Authenticated users can view schools"
  on public.schools for select
  using (true);

-- ── TEACHER JOIN CODE BACKFILL ────────────────────────────────

alter table public.schools
  add column if not exists teacher_join_code text unique;

update public.schools
set teacher_join_code = 'T' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6))
where teacher_join_code is null;

-- Verify — you should see name, join_code, and teacher_join_code
select name, join_code, teacher_join_code from public.schools;
