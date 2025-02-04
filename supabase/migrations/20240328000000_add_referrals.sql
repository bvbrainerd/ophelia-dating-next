-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    age INTEGER,
    gender TEXT,
    preferred_gender TEXT,
    bio TEXT,
    school TEXT DEFAULT 'Boston College',
    dater_archetype TEXT,
    dater_status TEXT DEFAULT 'bronze',
    average_rating NUMERIC DEFAULT 5.0,
    follow_through_rate INTEGER DEFAULT 100,
    is_admin BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add referral code to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add descriptors column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS descriptors JSONB DEFAULT '[]'::jsonb;

-- Drop existing referrals table if it exists
DROP TABLE IF EXISTS referrals CASCADE;

-- Create referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL REFERENCES profiles(referral_code) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(referred_id)  -- Each user can only be referred once
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_id_idx ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx ON referrals(referral_code);

-- Add RLS policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Add debug logging
  RAISE LOG 'handle_new_user called for user id: %', new.id;
  
  BEGIN
    INSERT INTO public.profiles (
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
      referral_code,
      descriptors,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      COALESCE(new.email, ''),
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
      generate_referral_code(),
      '[]'::jsonb,
      now(),
      now()
    );
    RETURN new;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN new; -- Still return new to allow user creation
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view and update own profile'
  ) THEN
    CREATE POLICY "Users can view and update own profile"
      ON profiles
      FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Create function to handle referral completion
CREATE OR REPLACE FUNCTION handle_referral_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user completes their profile setup, mark their referral as completed
  IF NEW.first_name != '' AND NEW.last_name != '' AND NEW.age IS NOT NULL AND NEW.gender IS NOT NULL THEN
    UPDATE referrals
    SET status = 'completed',
        updated_at = now()
    WHERE referred_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral completion
DROP TRIGGER IF EXISTS on_profile_update ON profiles;
CREATE TRIGGER on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_completion();

SELECT * FROM auth.users LIMIT 1; 