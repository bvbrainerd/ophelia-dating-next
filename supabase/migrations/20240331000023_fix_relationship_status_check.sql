-- Drop existing relationship status constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_partner_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_check_v2;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_relationship_status_check;

-- Clean up any inconsistent data
UPDATE profiles 
SET relationship_status = 'single',
    is_couple_profile = false,
    partner_email = NULL,
    partner_id = NULL,
    couple_verified = false
WHERE relationship_status NOT IN ('single', 'couple')
   OR relationship_status IS NULL;

-- Add new constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_relationship_status_check 
CHECK (
    relationship_status IN ('single', 'couple') AND
    (
        (relationship_status = 'single' AND is_couple_profile = false AND partner_email IS NULL AND partner_id IS NULL) OR
        (relationship_status = 'couple')
    )
); 