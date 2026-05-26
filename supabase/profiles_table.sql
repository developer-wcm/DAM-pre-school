-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/wvdrqhpcuqgmgeqahjqx/sql

-- 1. Create the profiles table
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text check (role in ('admin', 'teacher', 'parent', 'accountant')) not null default 'parent',
  school_id   text,
  approved    boolean not null default false,
  created_at  timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Allow insert during sign-up
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (true);

-- 6. Auto-create a profile row when a new user signs up via Google OAuth
create or replace function public.handle_new_user()
returns trigger as $$
declare
  school_id text;
  verification_code text;
begin
  -- Set school_id, default to DEMO01 if not provided
  school_id := coalesce(new.raw_user_meta_data->>'school_id', 'DEMO01');
  
  -- Set verification code (Google sign-ups default to parent role)
  verification_code := '123456';
  
  insert into public.profiles (id, full_name, role, school_id, approved, verification_code, code_expires_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'parent',   -- default role for Google sign-ups; admin can change later
    school_id,
    false,
    verification_code,
    now() + interval '1 year'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
