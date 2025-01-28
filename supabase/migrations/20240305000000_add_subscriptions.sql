-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period VARCHAR NOT NULL,
  features JSONB NOT NULL,
  stripe_price_id VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subscription_intents table
CREATE TABLE subscription_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  stripe_session_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  stripe_subscription_id VARCHAR,
  stripe_customer_id VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add is_premium column to profiles table
ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;

-- Create function to update profile is_premium status
CREATE OR REPLACE FUNCTION update_profile_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles SET is_premium = TRUE WHERE id = NEW.user_id;
  ELSIF NEW.status = 'canceled' OR NEW.status = 'expired' THEN
    UPDATE profiles SET is_premium = FALSE WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile is_premium status
CREATE TRIGGER update_profile_premium_status_trigger
AFTER INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_profile_premium_status();

-- Create RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by all authenticated users
CREATE POLICY "Subscription plans are readable by all authenticated users"
ON subscription_plans FOR SELECT
TO authenticated
USING (true);

-- Users can only see their own subscription intents
CREATE POLICY "Users can only see their own subscription intents"
ON subscription_intents FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Users can only see their own subscriptions
CREATE POLICY "Users can only see their own subscriptions"
ON user_subscriptions FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Insert initial subscription plans
INSERT INTO subscription_plans (name, price, period, features, stripe_price_id)
VALUES 
  ('Monthly', 19.99, 'month', '[
    "Send unlimited date requests",
    "Accept curated date suggestions",
    "Priority profile visibility",
    "See who liked your profile",
    "Advanced matching algorithms",
    "Premium customer support"
  ]'::jsonb, 'price_monthly'),
  ('Annual', 149.99, 'year', '[
    "All Monthly features",
    "Two months free",
    "Exclusive events access",
    "Premium badge on profile",
    "Advanced analytics",
    "Priority support"
  ]'::jsonb, 'price_annual'); 