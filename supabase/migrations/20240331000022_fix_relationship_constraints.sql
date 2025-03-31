-- First drop ALL existing relationship-related constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_partner_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS partner_reciprocal_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_partner_email_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS relationship_status_check_v2;

-- Clean up any inconsistent data first
UPDATE profiles 
SET relationship_status = 'single',
    is_couple_profile = false,
    partner_email = NULL,
    partner_id = NULL,
    couple_verified = false
WHERE relationship_status NOT IN ('single', 'couple')
   OR relationship_status IS NULL
   OR (relationship_status = 'single' AND (partner_id IS NOT NULL OR is_couple_profile = true));

-- Update couple profiles to be consistent
UPDATE profiles
SET is_couple_profile = true,
    couple_verified = COALESCE(couple_verified, false)
WHERE relationship_status = 'couple';

-- Finally add the new constraint
ALTER TABLE profiles
ADD CONSTRAINT relationship_status_check_v2 
CHECK (
  (relationship_status = 'single' AND is_couple_profile = false AND partner_id IS NULL) OR
  (relationship_status = 'couple' AND (partner_email IS NOT NULL OR partner_id IS NOT NULL))
); 