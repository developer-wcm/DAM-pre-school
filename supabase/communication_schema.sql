-- ============================================================
-- COMMUNICATION SCHEMA FOR DAM PRESCHOOL
-- Simplified version - Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add columns to profiles table
alter table profiles 
  add column if not exists role text check (role in ('parent', 'teacher', 'admin', 'principal')),
  add column if not exists full_name text,
  add column if not exists fcm_token text;

-- 2. Announcements table
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  target_audience text default 'all_parents',
  file_url text,
  created_at timestamptz default now()
);

-- Enable RLS for announcements
alter table announcements enable row level security;

-- Policies for announcements
create policy "Everyone can view announcements"
  on announcements for select
  using (auth.role() = 'authenticated');

create policy "Admin/Principal can create announcements"
  on announcements for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'principal')
    )
  );

-- 3. Conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references profiles(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable RLS for conversations
alter table conversations enable row level security;

-- Policies for conversations
create policy "Users can view their conversations"
  on conversations for select
  using (parent_id = auth.uid() or teacher_id = auth.uid());

create policy "Parents can create conversations"
  on conversations for insert
  with check (parent_id = auth.uid());

-- 4. Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text,
  file_url text,
  file_name text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS for messages
alter table messages enable row level security;

-- Policies for messages
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations
      where id = messages.conversation_id
      and (parent_id = auth.uid() or teacher_id = auth.uid())
    )
  );

create policy "Users can send messages in their conversations"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from conversations
      where id = conversation_id
      and (parent_id = auth.uid() or teacher_id = auth.uid())
    )
  );

create policy "Users can update their received messages"
  on messages for update
  using (
    exists (
      select 1 from conversations
      where id = messages.conversation_id
      and (parent_id = auth.uid() or teacher_id = auth.uid())
    )
  );

-- 5. Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text,
  reference_id uuid,
  title text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS for notifications
alter table notifications enable row level security;

-- Policies for notifications
create policy "Users can view their notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users can update their notifications"
  on notifications for update
  using (user_id = auth.uid());

-- 6. Create indexes for performance
create index if not exists idx_announcements_created_at on announcements(created_at desc);
create index if not exists idx_conversations_parent_id on conversations(parent_id);
create index if not exists idx_conversations_teacher_id on conversations(teacher_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_is_read on notifications(is_read);

