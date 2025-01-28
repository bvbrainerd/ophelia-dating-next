-- Add missing columns to valentine_requests table
alter table public.valentine_requests
add column if not exists sender_archetype text,
add column if not exists recipient_archetype text,
add column if not exists curated_by uuid references public.profiles(id),
add column if not exists curated_at timestamp with time zone;

-- Refresh the schema cache
notify pgrst, 'reload schema'; 