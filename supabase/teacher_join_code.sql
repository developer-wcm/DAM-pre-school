-- ============================================================
-- Teacher Join Code — Run in Supabase SQL Editor
-- ============================================================

-- 1. Add teacher_join_code column (safe to run multiple times)
alter table public.schools
  add column if not exists teacher_join_code text unique;

-- 2. Trigger function: auto-generate teacher_join_code on new school insert
create or replace function public.generate_teacher_join_code()
returns trigger as $$
declare
  new_code text;
begin
  if new.teacher_join_code is null then
    loop
      new_code := 'T' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (
        select 1 from public.schools where teacher_join_code = new_code
      );
    end loop;
    new.teacher_join_code := new_code;
  end if;
  return new;
end;
$$ language plpgsql;

-- 3. Attach trigger to schools table
drop trigger if exists on_school_created_generate_teacher_code on public.schools;
create trigger on_school_created_generate_teacher_code
  before insert on public.schools
  for each row execute procedure public.generate_teacher_join_code();

-- 4. Backfill teacher_join_code for ALL existing schools that don't have one
do $$
declare
  rec record;
  new_code text;
begin
  for rec in select id from public.schools where teacher_join_code is null loop
    loop
      new_code := 'T' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (
        select 1 from public.schools where teacher_join_code = new_code
      );
    end loop;
    update public.schools set teacher_join_code = new_code where id = rec.id;
    raise notice 'Set teacher_join_code = % for school id %', new_code, rec.id;
  end loop;
end;
$$;

-- 5. Verify — shows all schools with their codes
select name, join_code, teacher_join_code from public.schools;
