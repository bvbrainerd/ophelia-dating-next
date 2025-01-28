-- Drop all existing policies on profiles table
do $$ 
declare
  policy_name text;
begin
  for policy_name in (
    select policyname from pg_policies where tablename = 'profiles' and schemaname = 'public'
  )
  loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;
end $$;

-- Disable RLS temporarily
alter table public.profiles disable row level security;

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  dater_archetype text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update profiles table to ensure proper relationships
alter table public.profiles
alter column id set data type uuid using id::uuid,
add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- Add is_admin column if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_admin') then
    alter table public.profiles add column is_admin boolean default false;
  end if;
end $$;

-- Re-enable RLS and create new policies
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view any profile"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Ensure profiles are created for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, '', '');
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists and recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 