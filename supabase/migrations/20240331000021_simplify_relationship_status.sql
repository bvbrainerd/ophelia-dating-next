-- Drop existing relationship status type and constraints
DO $$ BEGIN
  -- Drop existing constraints
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_partner_email_check;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS partner_reciprocal_check;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_couple_status_check;

  -- Drop the enum type if it exists
  DROP TYPE IF EXISTS relationship_status;
END $$;

-- Create new relationship status type
CREATE TYPE relationship_status AS ENUM ('single', 'couple');

-- Update profiles table
ALTER TABLE profiles
  -- Update relationship_status column
  ALTER COLUMN relationship_status TYPE relationship_status USING 
    CASE 
      WHEN relationship_status::text = 'in_relationship' OR relationship_status::text = 'married' THEN 'couple'::relationship_status
      ELSE 'single'::relationship_status
    END,
  ALTER COLUMN relationship_status SET DEFAULT 'single',
  -- Update couple_status to match new schema
  DROP COLUMN IF EXISTS couple_status,
  -- Ensure partner-related fields exist
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS partner_email TEXT,
  ADD COLUMN IF NOT EXISTS is_couple_profile BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS couple_verified BOOLEAN DEFAULT false;

-- Add new constraints
ALTER TABLE profiles
ADD CONSTRAINT relationship_status_partner_check 
CHECK (
  (relationship_status = 'single' AND partner_id IS NULL AND partner_email IS NULL AND is_couple_profile = false) OR
  (relationship_status = 'couple' AND (partner_id IS NOT NULL OR partner_email IS NOT NULL) AND is_couple_profile = true)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_relationship_status ON profiles(relationship_status);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_email ON profiles(partner_email);

-- Update existing data
UPDATE profiles
SET relationship_status = 'couple'
WHERE relationship_status::text IN ('in_relationship', 'married');

UPDATE profiles
SET relationship_status = 'single'
WHERE relationship_status::text NOT IN ('couple', 'in_relationship', 'married') OR relationship_status IS NULL; 