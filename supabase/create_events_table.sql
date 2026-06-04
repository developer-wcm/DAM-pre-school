-- Create events table for calendar functionality
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  school_id    text not null,
  title        text not null,
  description  text,
  type         text not null default 'EVENT' check (type in ('EVENT', 'HOLIDAY')),
  date         timestamptz not null,
  start_time   text,
  created_at   timestamptz default now()
);

alter table public.events enable row level security;

drop policy if exists "Authenticated users can view events" on public.events;
create policy "Authenticated users can view events"
  on public.events for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin can manage events" on public.events;
create policy "Admin can manage events"
  on public.events for all
  using (auth.role() = 'authenticated');

-- Create index on date for faster queries
create index if not exists events_date_idx on public.events(date);
create index if not exists events_school_id_idx on public.events(school_id);
