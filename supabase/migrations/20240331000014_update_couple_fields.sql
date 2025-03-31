-- Remove redundant couple_interests column and update couple-related fields
DO $$ BEGIN
  -- Drop couple_interests column if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'couple_interests'
  ) THEN
    ALTER TABLE profiles DROP COLUMN couple_interests;
  END IF;

  -- Drop existing constraint if it exists
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS partner_reciprocal_check;

  -- Add or update columns
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_status text DEFAULT 'single' CHECK (relationship_status IN ('single', 'in_relationship'));
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_email text;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_couple_profile boolean DEFAULT false;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS couple_verified boolean DEFAULT false;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS couple_preferences jsonb DEFAULT '{"shared_interests": true, "double_dates": true}'::jsonb;

  -- Add updated constraint
  ALTER TABLE profiles ADD CONSTRAINT partner_reciprocal_check 
    CHECK (
      (relationship_status = 'single' AND partner_email IS NULL AND is_couple_profile = false) OR 
      (relationship_status = 'in_relationship' AND partner_email IS NOT NULL AND is_couple_profile = true)
    );
END $$; 