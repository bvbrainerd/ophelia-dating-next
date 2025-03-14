-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_payment_method_id text NOT NULL,
    last4 text NOT NULL,
    brand text NOT NULL,
    exp_month integer NOT NULL,
    exp_year integer NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, stripe_payment_method_id)
);

-- Add payment-related fields to date_requests table
ALTER TABLE public.date_requests
ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_refund_id text; 