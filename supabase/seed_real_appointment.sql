-- Insert a real appointment using actual parent + teacher accounts

insert into public.appointments
  (school_id, parent_id, parent_name, teacher_id, teacher_name, student_name, date, time_slot, topic, status)
select
  p.school_id,
  p.id                        as parent_id,
  p.full_name                 as parent_name,
  t.id                        as teacher_id,
  t.full_name                 as teacher_name,
  'Test Student'              as student_name,
  (current_date + 1)           as date,
  '10:00 AM – 10:30 AM'       as time_slot,
  'Parent-Teacher Meeting'    as topic,
  'requested'                 as status
from
  (select id, full_name, school_id from public.profiles where email = 'mokshakukkunuru@gmail.com'  limit 1) p,
  (select id, full_name            from public.profiles where email = 'kukkunurumoksha7@gmail.com' limit 1) t;
