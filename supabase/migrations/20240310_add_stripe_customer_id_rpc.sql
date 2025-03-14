-- Create RPC function to add stripe_customer_id column
CREATE OR REPLACE FUNCTION add_stripe_customer_id_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'stripe_customer_id'
  ) THEN
    -- Add the column if it doesn't exist
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text';
  END IF;
END;
$$; 