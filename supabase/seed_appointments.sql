-- Seed demo appointments for DEMO01 school
-- Run this in Supabase SQL Editor after create_appointments.sql

insert into public.appointments
  (school_id, parent_name, teacher_name, student_name, date, time_slot, topic, status)
values
  ('DEMO01', 'Mrs. Sunita Kumar',  'Ms. Priya Sharma',   'Priya Kumar',  (current_date + 1)::text,  '10:00 AM – 10:30 AM', 'Behavioral concerns',  'requested'),
  ('DEMO01', 'Mr. Arjun Singh',    'Ms. Deepa Nair',     'Rohan Singh',  (current_date + 2)::text,  '02:00 PM – 02:30 PM', 'Annual Review',        'confirmed'),
  ('DEMO01', 'Mrs. Kavitha Reddy', 'Mr. Rahul Mehta',    'Ananya Reddy', (current_date + 4)::text,  '11:00 AM – 11:30 AM', 'Progress Update',      'rescheduled'),
  ('DEMO01', 'Mr. Suresh Patel',   'Ms. Anjali Krishnan','Dev Patel',    (current_date + 7)::text,  '09:30 AM – 10:00 AM', 'Fee Discussion',       'requested'),
  ('DEMO01', 'Mrs. Lalitha Nair',  'Ms. Priya Sharma',   'Arjun Nair',   (current_date - 5)::text,  '10:00 AM – 10:30 AM', 'Mid-term Review',      'completed'),
  ('DEMO01', 'Mr. Venkat Rao',     'Ms. Deepa Nair',     'Sneha Rao',    (current_date - 10)::text, '03:00 PM – 03:30 PM', 'Attendance concerns',  'completed');
