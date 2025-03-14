-- Add stripe_customer_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add couple_status to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS couple_status text CHECK (couple_status IN ('single', 'in_relationship')); 