-- Create chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Add updated_at trigger
drop trigger if exists set_timestamp_chat_messages on public.chat_messages;
create trigger set_timestamp_chat_messages
before update on public.chat_messages
for each row execute function public.handle_updated_at();

-- Policies
drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select"
  on public.chat_messages
  for select
  using (
    chat_messages.company_id = public.get_company_id_for_user(auth.uid())
    and (chat_messages.sender_id = auth.uid() or chat_messages.receiver_id = auth.uid())
  );

drop policy if exists "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert"
  on public.chat_messages
  for insert
  with check (
    chat_messages.company_id = public.get_company_id_for_user(auth.uid())
    and chat_messages.sender_id = auth.uid()
  );

drop policy if exists "chat_messages_update" on public.chat_messages;
create policy "chat_messages_update"
  on public.chat_messages
  for update
  using (
    chat_messages.company_id = public.get_company_id_for_user(auth.uid())
    and (chat_messages.sender_id = auth.uid() or chat_messages.receiver_id = auth.uid())
  );

-- Realtime replication
-- We need to add chat_messages to supabase_realtime publication
alter publication supabase_realtime add table public.chat_messages;

-- Indexes for performance
create index if not exists chat_messages_company_id_idx on public.chat_messages (company_id);
create index if not exists chat_messages_sender_id_idx on public.chat_messages (sender_id);
create index if not exists chat_messages_receiver_id_idx on public.chat_messages (receiver_id);
