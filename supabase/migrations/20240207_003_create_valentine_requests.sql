-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Drop the valentine_requests table if it exists
drop table if exists public.valentine_requests cascade;

create table public.valentine_requests (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  recipient_email text,
  recipient_name text,
  message text,
  is_anonymous boolean default false,
  sender_archetype text,
  curated_venue text,
  curated_time timestamp with time zone,
  curated_by uuid references public.profiles(id) on delete set null,
  curated_at timestamp with time zone,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create policies for valentine_requests
create policy "Users can view their own valentine requests"
  on public.valentine_requests for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can create valentine requests"
  on public.valentine_requests for insert
  with check (auth.uid() = sender_id);

create policy "Users can update their own valentine requests"
  on public.valentine_requests for update
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

create policy "Users can delete their own valentine requests"
  on public.valentine_requests for delete
  using (auth.uid() = sender_id);

-- Enable RLS on valentine_requests
alter table public.valentine_requests enable row level security;

-- Create indexes for faster lookups
create index valentine_requests_recipient_email_idx on public.valentine_requests(recipient_email);
create index valentine_requests_sender_id_idx on public.valentine_requests(sender_id);
create index valentine_requests_recipient_id_idx on public.valentine_requests(recipient_id);

-- Create policies
create policy "Admins can update all valentine requests"
  on public.valentine_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  ); 