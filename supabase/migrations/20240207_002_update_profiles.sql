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

-- Drop the valentine_requests table first since it depends on profiles
drop table if exists public.valentine_requests cascade;

-- Create backup tables for all dependent tables
create table if not exists messages_backup as select * from public.messages;
create table if not exists date_requests_backup as select * from public.date_requests;
create table if not exists match_feed_backup as select * from public.match_feed;
create table if not exists email_logs_backup as select * from public.email_logs;

-- Drop dependent tables with CASCADE
drop table if exists public.messages cascade;
drop table if exists public.date_requests cascade;
drop table if exists public.match_feed cascade;
drop table if exists public.email_logs cascade;

-- Create a backup of existing profiles
create table if not exists profiles_backup as 
select * from public.profiles;

-- Log the backup data to check what we have
do $$
declare
  profile_count integer;
  r record;
begin
  select count(*) into profile_count from profiles_backup;
  raise notice 'Number of profiles in backup: %', profile_count;
  
  -- Log a sample of the data
  raise notice 'Sample of backup data:';
  for r in (select id, email, first_name, last_name, age from profiles_backup limit 5)
  loop
    raise notice 'ID: %, Email: %, First: %, Last: %, Age: %', 
      r.id, r.email, r.first_name, r.last_name, r.age;
  end loop;
end $$;

-- Drop the profiles table with CASCADE to handle all dependencies
drop table if exists public.profiles cascade;

-- Drop existing constraints and indexes on profiles
do $$
begin
  if exists (select 1 from information_schema.table_constraints where table_name = 'profiles' and constraint_name = 'profiles_pkey') then
    alter table public.profiles drop constraint profiles_pkey;
  end if;
  if exists (select 1 from information_schema.table_constraints where table_name = 'profiles' and constraint_name = 'profiles_id_fkey') then
    alter table public.profiles drop constraint profiles_id_fkey;
  end if;
end $$;

-- Recreate profiles table with new structure
drop table if exists public.profiles cascade;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text not null default '',
  last_name text not null default '',
  avatar_url text,
  dater_archetype text DEFAULT 'cautiousDater' CHECK (dater_archetype IS NULL OR dater_archetype = '' OR dater_archetype IN ('hopelessRomantic', 'cautiousDater', 'commitmentSeeker', 'serialDater', 'friendsWithBenefits')),
  preferred_gender text CHECK (preferred_gender IS NULL OR preferred_gender IN ('male', 'female', 'other')),
  gender text CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
  age integer CHECK (age IS NULL OR age >= 18),
  bio text,
  school text DEFAULT 'Boston College',
  dater_status text DEFAULT 'bronze' CHECK (dater_status IN ('gold', 'silver', 'bronze')),
  average_rating numeric DEFAULT 5.0,
  follow_through_rate integer DEFAULT 100,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Copy valid data back from backup
do $$
declare
  col_exists boolean;
  r record;
begin
  -- Check if updated_at column exists
  select exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles_backup' 
    and column_name = 'updated_at'
  ) into col_exists;

  -- Insert data with direct column mapping
  execute format('
    insert into public.profiles (
      id, 
      email, 
      first_name, 
      last_name, 
      avatar_url, 
      dater_archetype, 
      preferred_gender, 
      gender, 
      age, 
      bio, 
      school, 
      dater_status,
      average_rating,
      follow_through_rate,
      is_admin, 
      created_at, 
      updated_at
    )
    select 
      b.id,
      b.email,
      coalesce(b.first_name, ''''),
      coalesce(b.last_name, ''''),
      b.avatar_url,
      CASE 
        WHEN b.dater_archetype = '''' THEN NULL
        WHEN b.dater_archetype = ''Hopeless Romantic'' THEN ''hopelessRomantic''
        WHEN b.dater_archetype = ''Cautious Dater'' THEN ''cautiousDater''
        WHEN b.dater_archetype = ''Commitment Seeker'' THEN ''commitmentSeeker''
        WHEN b.dater_archetype = ''Serial Dater'' THEN ''serialDater''
        WHEN b.dater_archetype = ''Friends with Benefits'' THEN ''friendsWithBenefits''
        WHEN b.dater_archetype = ''adventurous'' THEN ''serialDater''
        WHEN b.dater_archetype = ''traditional'' THEN ''commitmentSeeker''
        WHEN b.dater_archetype = ''independent'' THEN ''serialDater''
        WHEN b.dater_archetype = ''hopelessRomantic'' THEN ''hopelessRomantic''
        WHEN b.dater_archetype = ''cautiousDater'' THEN ''cautiousDater''
        WHEN b.dater_archetype = ''commitmentSeeker'' THEN ''commitmentSeeker''
        WHEN b.dater_archetype = ''serialDater'' THEN ''serialDater''
        WHEN b.dater_archetype = ''friendsWithBenefits'' THEN ''friendsWithBenefits''
        ELSE ''cautiousDater''
      END,
      CASE 
        WHEN b.preferred_gender = '''' THEN NULL
        ELSE b.preferred_gender 
      END,
      CASE 
        WHEN b.gender = '''' THEN NULL
        ELSE b.gender 
      END,
      (case when b.age::text ~ ''^[0-9]+$'' then b.age::integer else null end),
      CASE 
        WHEN b.bio = '''' THEN NULL
        ELSE b.bio 
      END,
      coalesce(b.school, ''Boston College''),
      ''bronze'',
      5.0,
      100,
      coalesce(b.is_admin, false),
      coalesce(b.created_at, now()),
      %s
    from profiles_backup b
    inner join auth.users u on u.id = b.id::uuid',
    case when col_exists then 'b.updated_at' else 'now()' end
  );

  -- Log the results of the insert
  raise notice 'Number of profiles after insert: %', (select count(*) from public.profiles);
  
  -- Log a sample of the restored data to verify
  raise notice 'Sample of restored profiles:';
  for r in (
    select id, email, first_name, last_name, gender, age, preferred_gender, dater_archetype, bio 
    from public.profiles 
    limit 5
  ) loop
    raise notice 'ID: %, Email: %, Name: % %, Gender: %, Age: %, Pref Gender: %, Archetype: %, Bio: %',
      r.id, r.email, r.first_name, r.last_name, r.gender, r.age, r.preferred_gender, r.dater_archetype, r.bio;
  end loop;
end $$;

-- Recreate dependent tables with proper references
create table public.date_requests (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending',
  venue text,
  proposed_time timestamp with time zone,
  proposed_payment numeric,
  split_payment boolean default false
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  date_id uuid references public.date_requests(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.match_feed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  potential_match_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending'
);

create table public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  email_type text not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'sent'
);

-- Copy valid data back to dependent tables
do $$
declare
  col_exists boolean;
  has_updated_at boolean;
  has_proposed_payment boolean;
  has_proposed_time boolean;
  has_venue boolean;
  has_sender_id boolean;
  has_user_id boolean;
begin
  -- Check which columns exist in date_requests_backup
  select exists (
    select 1 from information_schema.columns 
    where table_name = 'date_requests_backup' 
    and column_name = 'updated_at'
  ) into has_updated_at;

  select exists (
    select 1 from information_schema.columns 
    where table_name = 'date_requests_backup' 
    and column_name = 'proposed_payment'
  ) into has_proposed_payment;

  select exists (
    select 1 from information_schema.columns 
    where table_name = 'date_requests_backup' 
    and column_name = 'proposed_time'
  ) into has_proposed_time;

  select exists (
    select 1 from information_schema.columns 
    where table_name = 'date_requests_backup' 
    and column_name = 'venue'
  ) into has_venue;

  -- Build and execute dynamic SQL for date_requests insert
  execute format('
    insert into public.date_requests (
      id, sender_id, receiver_id, created_at, updated_at, 
      status, venue, proposed_time, proposed_payment, split_payment
    )
    select 
      uuid_generate_v4(), p1.id, p2.id, 
      coalesce(dr.created_at, now()), %s,
      coalesce(dr.status, ''pending''), %s, %s, %s, %s
    from date_requests_backup dr
    inner join public.profiles p1 on p1.id = dr.sender_id::uuid
    inner join public.profiles p2 on p2.id = dr.receiver_id::uuid',
    case when has_updated_at then 'dr.updated_at' else 'now()' end,
    case when has_venue then 'dr.venue' else 'null' end,
    case when has_proposed_time then 'dr.proposed_time' else 'null' end,
    case when has_proposed_payment then 'dr.proposed_payment' else 'null' end,
    case when exists (select 1 from information_schema.columns where table_name = 'date_requests_backup' and column_name = 'split_payment')
         then 'dr.split_payment' else 'false' end
  );

  -- Check which sender column exists in messages
  select exists (
    select 1 from information_schema.columns 
    where table_name = 'messages_backup' 
    and column_name = 'sender_id'
  ) into has_sender_id;

  select exists (
    select 1 from information_schema.columns 
    where table_name = 'messages_backup' 
    and column_name = 'user_id'
  ) into has_user_id;

  -- Insert messages with new UUIDs
  if has_sender_id then
    -- Use sender_id if it exists
    if exists (select 1 from information_schema.columns where table_name = 'messages_backup' and column_name = 'updated_at') then
      insert into public.messages (
        id, date_id, sender_id, content, created_at, updated_at
      )
      select 
        uuid_generate_v4(), d.id, p.id, m.content,
        coalesce(m.created_at, now()), m.updated_at
      from messages_backup m
      inner join date_requests_backup dr on dr.id = m.date_id
      inner join public.date_requests d on d.sender_id = dr.sender_id::uuid and d.receiver_id = dr.receiver_id::uuid
      inner join public.profiles p on p.id = m.sender_id::uuid;
    else
      insert into public.messages (
        id, date_id, sender_id, content, created_at, updated_at
      )
      select 
        uuid_generate_v4(), d.id, p.id, m.content,
        coalesce(m.created_at, now()), now()
      from messages_backup m
      inner join date_requests_backup dr on dr.id = m.date_id
      inner join public.date_requests d on d.sender_id = dr.sender_id::uuid and d.receiver_id = dr.receiver_id::uuid
      inner join public.profiles p on p.id = m.sender_id::uuid;
    end if;
  elsif has_user_id then
    -- Use user_id if it exists
    if exists (select 1 from information_schema.columns where table_name = 'messages_backup' and column_name = 'updated_at') then
      insert into public.messages (
        id, date_id, sender_id, content, created_at, updated_at
      )
      select 
        uuid_generate_v4(), d.id, p.id, m.content,
        coalesce(m.created_at, now()), m.updated_at
      from messages_backup m
      inner join date_requests_backup dr on dr.id = m.date_id
      inner join public.date_requests d on d.sender_id = dr.sender_id::uuid and d.receiver_id = dr.receiver_id::uuid
      inner join public.profiles p on p.id = m.user_id::uuid;
    else
      insert into public.messages (
        id, date_id, sender_id, content, created_at, updated_at
      )
      select 
        uuid_generate_v4(), d.id, p.id, m.content,
        coalesce(m.created_at, now()), now()
      from messages_backup m
      inner join date_requests_backup dr on dr.id = m.date_id
      inner join public.date_requests d on d.sender_id = dr.sender_id::uuid and d.receiver_id = dr.receiver_id::uuid
      inner join public.profiles p on p.id = m.user_id::uuid;
    end if;
  else
    -- If neither exists, use the sender_id from the date_request
    if exists (select 1 from information_schema.columns where table_name = 'messages_backup' and column_name = 'updated_at') then
      insert into public.messages (
        id, date_id, sender_id, content, created_at, updated_at
      )
      select 
        uuid_generate_v4(), d.id, d.sender_id, m.content,
        coalesce(m.created_at, now()), m.updated_at
      from messages_backup m
      inner join date_requests_backup dr on dr.id = m.date_id
      inner join public.date_requests d on d.sender_id = dr.sender_id::uuid and d.receiver_id = dr.receiver_id::uuid;
    else
      insert into public.messages (
        id, date_id, sender_id, content, created_at, updated_at
      )
      select 
        uuid_generate_v4(), d.id, d.sender_id, m.content,
        coalesce(m.created_at, now()), now()
      from messages_backup m
      inner join date_requests_backup dr on dr.id = m.date_id
      inner join public.date_requests d on d.sender_id = dr.sender_id::uuid and d.receiver_id = dr.receiver_id::uuid;
    end if;
  end if;

  -- Insert match_feed with new UUIDs
  execute format('
    insert into public.match_feed (
      id, user_id, potential_match_id, created_at, updated_at, status
    )
    select 
      uuid_generate_v4(), p1.id, p2.id,
      coalesce(mf.created_at, now()), %s,
      %s
    from match_feed_backup mf
    inner join public.profiles p1 on p1.id = mf.user_id::uuid
    inner join public.profiles p2 on p2.id = mf.potential_match_id::uuid',
    case when exists (select 1 from information_schema.columns where table_name = 'match_feed_backup' and column_name = 'updated_at')
         then 'mf.updated_at' else 'now()' end,
    case when exists (select 1 from information_schema.columns where table_name = 'match_feed_backup' and column_name = 'status')
         then 'coalesce(mf.status, ''pending'')' else '''pending''' end
  );

  -- Insert email_logs with new UUIDs
  if exists (select 1 from information_schema.columns where table_name = 'email_logs_backup' and column_name = 'sent_at') then
    insert into public.email_logs (
      id, sender_id, recipient_id, email_type, sent_at, status
    )
    select 
      uuid_generate_v4(), p1.id, p2.id, el.email_type,
      el.sent_at, coalesce(el.status, 'sent')
    from email_logs_backup el
    inner join public.profiles p1 on p1.id = el.sender_id::uuid
    inner join public.profiles p2 on p2.id = el.recipient_id::uuid;
  else
    insert into public.email_logs (
      id, sender_id, recipient_id, email_type, sent_at, status
    )
    select 
      uuid_generate_v4(), p1.id, p2.id, el.email_type,
      now(), coalesce(el.status, 'sent')
    from email_logs_backup el
    inner join public.profiles p1 on p1.id = el.sender_id::uuid
    inner join public.profiles p2 on p2.id = el.recipient_id::uuid;
  end if;
end $$;

-- Drop backup tables
drop table if exists profiles_backup;
drop table if exists messages_backup;
drop table if exists date_requests_backup;
drop table if exists match_feed_backup;
drop table if exists email_logs_backup;

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
  insert into public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    age,
    gender,
    preferred_gender,
    bio,
    school,
    dater_archetype,
    dater_status,
    average_rating,
    follow_through_rate,
    is_admin,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    '',
    '',
    null,
    null,
    null,
    '',
    'Boston College',
    null,
    'bronze',
    5.0,
    100,
    false,
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists and recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

-- Update existing profiles with default values
UPDATE public.profiles
SET 
  dater_status = COALESCE(dater_status, 'bronze'),
  average_rating = COALESCE(average_rating, 5.0),
  follow_through_rate = COALESCE(follow_through_rate, 100),
  school = COALESCE(school, 'Boston College')
WHERE dater_status IS NULL 
   OR average_rating IS NULL 
   OR follow_through_rate IS NULL
   OR school IS NULL;