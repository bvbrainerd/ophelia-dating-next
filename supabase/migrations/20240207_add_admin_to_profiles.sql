-- Add is_admin column to profiles table
alter table public.profiles
add column if not exists is_admin boolean default false;

-- Create index for faster admin lookups
create index if not exists profiles_is_admin_idx on public.profiles(is_admin);

-- Set initial admin (optional - you can set this to your user ID)
-- update public.profiles
-- set is_admin = true
-- where id = 'your-user-id-here'; 