-- Add new columns for date curation
alter table public.valentine_requests
add column if not exists curated_venue text,
add column if not exists curated_time timestamp with time zone,
add column if not exists curated_by uuid references public.profiles(id),
add column if not exists curated_at timestamp with time zone,
add column if not exists sender_archetype text,
add column if not exists recipient_archetype text;

-- Add policy for admins to update curated fields
create policy "Admins can update curated fields"
  on public.valentine_requests
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  ); 