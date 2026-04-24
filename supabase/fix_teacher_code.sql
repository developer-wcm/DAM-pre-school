-- ============================================================
-- Fix: Generate teacher_join_code for all schools missing one
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Backfill any schools with null teacher_join_code
do $$
declare
  rec record;
  new_code text;
begin
  for rec in select id, join_code from public.schools where teacher_join_code is null loop
    loop
      new_code := 'T' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (
        select 1 from public.schools where teacher_join_code = new_code
      );
    end loop;
    update public.schools set teacher_join_code = new_code where id = rec.id;
    raise notice 'School % (%) → teacher_join_code = %', rec.join_code, rec.id, new_code;
  end loop;
end;
$$;

-- Step 2: Verify — you should see the teacher_join_code filled in
select name, join_code, teacher_join_code from public.schools;
