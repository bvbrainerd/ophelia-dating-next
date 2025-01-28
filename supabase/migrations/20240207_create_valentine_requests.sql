-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Drop existing indexes if they exist
drop index if exists public.valentine_requests_recipient_email_idx;
drop index if exists public.valentine_requests_sender_id_idx;
drop index if exists public.valentine_requests_recipient_id_idx;

-- Drop existing policies if they exist
drop policy if exists "Users can view their sent or received valentine requests" on public.valentine_requests;
drop policy if exists "Users can create valentine requests" on public.valentine_requests;
drop policy if exists "Users can update their valentine requests" on public.valentine_requests;
drop policy if exists "Users can update their received valentine requests" on public.valentine_requests;
drop policy if exists "Admins can update curated fields" on public.valentine_requests;

-- Drop table if exists
drop table if exists public.valentine_requests;

-- Create valentine_requests table
create table public.valentine_requests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender_id uuid references auth.users(id) not null,
  recipient_email text not null,
  recipient_name text not null,
  is_anonymous boolean default false not null,
  status text default 'pending' not null,
  curated_venue text,
  curated_time timestamp with time zone,
  curated_by uuid references auth.users(id),
  curated_at timestamp with time zone,
  sender_archetype text,
  recipient_archetype text,
  recipient_id uuid references auth.users(id),
  
  constraint valentine_requests_status_check 
    check (status in ('pending', 'curated', 'accepted', 'declined'))
);

-- Create indexes for faster lookups
create index valentine_requests_recipient_email_idx on public.valentine_requests(recipient_email);
create index valentine_requests_sender_id_idx on public.valentine_requests(sender_id);
create index valentine_requests_recipient_id_idx on public.valentine_requests(recipient_id);

-- Enable RLS
alter table public.valentine_requests enable row level security;

-- Create policies
create policy "Users can view their sent or received valentine requests"
  on public.valentine_requests for select
  using (
    auth.uid() = sender_id 
    or recipient_email = auth.email()
    or recipient_id = auth.uid()
  );

create policy "Users can create valentine requests"
  on public.valentine_requests for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can update their valentine requests"
  on public.valentine_requests for update
  using (
    recipient_email = auth.email()
    or recipient_id = auth.uid()
  );

create policy "Admins can update all valentine requests"
  on public.valentine_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  ); 