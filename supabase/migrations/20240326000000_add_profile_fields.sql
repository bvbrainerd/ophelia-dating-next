-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dater_status text CHECK (dater_status IN ('gold', 'silver', 'bronze')),
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS follow_through_rate integer DEFAULT 100; 