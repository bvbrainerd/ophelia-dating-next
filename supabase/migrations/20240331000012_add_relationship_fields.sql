-- First, ensure the relationship_status type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship_status') THEN
        CREATE TYPE relationship_status AS ENUM ('single', 'in_relationship', 'married');
    END IF;
END $$;

-- Add relationship fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS relationship_status relationship_status DEFAULT 'single',
ADD COLUMN IF NOT EXISTS partner_email TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS couple_bio TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS couple_interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS couple_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_couple_profile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS couple_verified BOOLEAN DEFAULT false;

-- Drop existing constraints if they exist
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS relationship_status_partner_email_check,
DROP CONSTRAINT IF EXISTS partner_reciprocal_check;

-- Add constraints
ALTER TABLE profiles
ADD CONSTRAINT relationship_status_partner_email_check 
CHECK (
    (relationship_status = 'in_relationship' AND partner_email IS NOT NULL) OR
    (relationship_status != 'in_relationship' AND partner_email IS NULL)
);

ALTER TABLE profiles
ADD CONSTRAINT partner_reciprocal_check
CHECK (
    (partner_id IS NULL AND is_couple_profile = false) OR
    (partner_id IS NOT NULL AND is_couple_profile = true)
);

-- Create or replace indexes
DROP INDEX IF EXISTS idx_profiles_partner_email;
CREATE INDEX idx_profiles_partner_email ON profiles(partner_email);

DROP INDEX IF EXISTS idx_profiles_partner_id;
CREATE INDEX idx_profiles_partner_id ON profiles(partner_id);

-- Grant necessary permissions
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO service_role;

-- Add column comments
COMMENT ON COLUMN profiles.relationship_status IS 'Current relationship status of the user';
COMMENT ON COLUMN profiles.partner_email IS 'Email of the partner for couples';
COMMENT ON COLUMN profiles.partner_id IS 'ID reference to the partner profile';
COMMENT ON COLUMN profiles.couple_bio IS 'Shared biography for couples';
COMMENT ON COLUMN profiles.couple_interests IS 'Array of shared interests for couples';
COMMENT ON COLUMN profiles.couple_preferences IS 'JSON object containing couple-specific preferences';
COMMENT ON COLUMN profiles.is_couple_profile IS 'Boolean flag indicating if this is a couple profile';
COMMENT ON COLUMN profiles.couple_verified IS 'Boolean indicating if both partners have verified the relationship';
