-- ============================================================
-- DEMO ADMIN USER
-- Email:    admin@dmapreschool.com
-- Password: Admin@1234
-- ============================================================

-- Step 1: Create auth user only if it doesn't exist yet
do $$
begin
  if not exists (select 1 from auth.users where email = 'admin@dmapreschool.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'admin@dmapreschool.com',
      crypt('Admin@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Admin"}',
      now(), now(), '', '', '', ''
    );
  end if;
end $$;

-- Step 2: Create the school with join code DEMO01
insert into public.schools (id, name, join_code)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'DMA PreSchool',
  'DEMO01'
)
on conflict (join_code) do update set name = 'DMA PreSchool';

-- Step 2b: Ensure teacher_join_code is set for the demo school
do $$
declare
  new_code text;
begin
  if exists (
    select 1 from public.schools
    where join_code = 'DEMO01' and teacher_join_code is null
  ) then
    loop
      new_code := 'T' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (
        select 1 from public.schools where teacher_join_code = new_code
      );
    end loop;
    update public.schools set teacher_join_code = new_code where join_code = 'DEMO01';
    raise notice 'Generated teacher_join_code: %', new_code;
  end if;
end;
$$;

-- Step 3: Upsert admin profile
insert into public.profiles (id, full_name, role, school_id, approved)
select id, 'Demo Admin', 'admin', 'DEMO01', true
from auth.users
where email = 'admin@dmapreschool.com'
on conflict (id) do update
  set full_name = 'Demo Admin',
      role      = 'admin',
      school_id = 'DEMO01',
      approved  = true;
