-- System Settings table for per-school configuration

create table if not exists public.school_settings (
  school_id               text        primary key,
  school_name             text        not null default 'DAM PreSchool',
  school_address          text        not null default '',
  school_phone            text        not null default '',
  school_email            text        not null default '',
  academic_year           text        not null default '2025-2026',
  principal_name          text        not null default '',
  fee_due_day             integer     not null default 10 check (fee_due_day between 1 and 28),
  late_fee_amount         numeric     not null default 0,
  attendance_cutoff_time  text        not null default '09:30',
  notify_absent_parents   boolean     not null default true,
  notify_fee_overdue      boolean     not null default true,
  notify_leave_requests   boolean     not null default true,
  auto_approve_parents    boolean     not null default false,
  active_classes          text[]      not null default '{PG,PKG,JKG,SKG}',
  updated_at              timestamptz not null default now()
);

-- RLS: only admin/principal of the school can read or write
alter table public.school_settings enable row level security;

create policy "Admin can manage school settings"
  on public.school_settings
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and school_id = school_settings.school_id
        and role in ('admin', 'principal')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and school_id = school_settings.school_id
        and role in ('admin', 'principal')
    )
  );

-- Any signed-in member of the school can READ settings (teachers need the
-- staff WiFi name for auto check-in). Writes stay restricted to admin/principal.
drop policy if exists "school members can view settings" on public.school_settings;
create policy "school members can view settings"
  on public.school_settings
  for select
  using (
    school_id in (
      select school_id from public.profiles where id = auth.uid()
    )
  );

-- Seed default row for DEMO01
insert into public.school_settings (school_id, school_name)
values ('DEMO01', 'DAM PreSchool')
on conflict (school_id) do nothing;
