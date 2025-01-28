-- Create valentine_requests table
create table if not exists public.valentine_requests (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    sender_id uuid references public.profiles(id) not null,
    recipient_email text not null,
    recipient_name text not null,
    is_anonymous boolean default false not null,
    status text default 'pending' not null,
    curated_venue text,
    curated_time timestamp with time zone,
    recipient_id uuid references public.profiles(id)
);

-- Add RLS policies
alter table public.valentine_requests enable row level security;

create policy "Users can view their sent or received valentine requests"
    on public.valentine_requests for select
    using (
        auth.uid() = sender_id or 
        recipient_id = auth.uid() or 
        recipient_email = auth.email()
    );

create policy "Users can create valentine requests"
    on public.valentine_requests for insert
    with check (auth.uid() = sender_id);

create policy "Users can update their valentine requests"
    on public.valentine_requests for update
    using (auth.uid() = sender_id);

-- Create index for faster lookups
create index valentine_requests_recipient_email_idx on public.valentine_requests(recipient_email);
create index valentine_requests_sender_id_idx on public.valentine_requests(sender_id);
create index valentine_requests_recipient_id_idx on public.valentine_requests(recipient_id); 