-- Drop all policies and table for valentine_requests
do $$ 
declare
  policy_name text;
begin
  -- Drop all policies
  for policy_name in (
    select policyname from pg_policies where tablename = 'valentine_requests' and schemaname = 'public'
  )
  loop
    execute format('drop policy if exists %I on public.valentine_requests', policy_name);
  end loop;
end $$;

-- Drop indexes if they exist
drop index if exists public.valentine_requests_recipient_email_idx;
drop index if exists public.valentine_requests_sender_id_idx;
drop index if exists public.valentine_requests_recipient_id_idx;

-- Drop the table
drop table if exists public.valentine_requests; 