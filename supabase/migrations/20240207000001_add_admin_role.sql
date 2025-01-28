-- Add admin field to profiles
alter table public.profiles 
add column if not exists is_admin boolean default false;

-- Add policy for admin access
create policy "Admins can update valentine requests"
    on public.valentine_requests for update
    using (
        (select is_admin from public.profiles where id = auth.uid()) = true
    );

-- Add policy for admin view access
create policy "Admins can view all valentine requests"
    on public.valentine_requests for select
    using (
        (select is_admin from public.profiles where id = auth.uid()) = true
    ); 