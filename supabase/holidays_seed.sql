-- ============================================================
-- STEP 1: Run this first — adds columns to holidays table
-- ============================================================
alter table public.holidays
  add column if not exists date_to date,
  add column if not exists days int not null default 1;


-- ============================================================
-- STEP 2: Run this second — inserts all holiday data
-- ============================================================
insert into public.holidays (school_id, name, date, date_to, days) values
  ('DEMO01', 'Ganesh Chaturthi',             '2026-09-14', '2026-09-14', 1),
  ('DEMO01', 'Gandhi Jayanthi',              '2026-10-02', '2026-10-02', 1),
  ('DEMO01', 'Term 1 Break',                 '2026-10-19', '2026-10-23', 5),
  ('DEMO01', 'Annual Prayer Conference',     '2026-10-30', '2026-10-30', 1),
  ('DEMO01', 'Tentative Holiday',            '2026-11-02', '2026-11-02', 1),
  ('DEMO01', 'Diwali Holidays',              '2026-11-09', '2026-11-10', 2),
  ('DEMO01', 'Kanakadasa Jayanti',           '2026-11-27', '2026-11-27', 1),
  ('DEMO01', 'Term 2 Break / Christmas',     '2026-12-21', '2026-12-31', 9),
  ('DEMO01', 'New Year',                     '2027-01-01', '2027-01-01', 1),
  ('DEMO01', 'Uttarayan (Makara Sankranti)', '2027-01-14', '2027-01-14', 1),
  ('DEMO01', 'Republic Day',                 '2027-01-26', '2027-01-26', 1),
  ('DEMO01', 'Summer Holidays',              '2027-03-22', '2027-05-25', 65);
