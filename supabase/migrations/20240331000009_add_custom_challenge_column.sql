-- Add custom_challenge column to user_challenges table
ALTER TABLE user_challenges
ADD COLUMN IF NOT EXISTS custom_challenge JSONB;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_custom_challenge 
ON user_challenges USING GIN(custom_challenge);

-- Update RLS policies to allow access to custom_challenge
DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
CREATE POLICY "Users can view their own challenges"
ON user_challenges FOR SELECT
USING (
    user_id = auth.uid() OR 
    challenger_id = auth.uid() OR
    date_partner_id = auth.uid() OR
    (visibility = 'public') OR
    (visibility = 'groups' AND group_ids && (
        SELECT array_agg(group_id) 
        FROM group_members 
        WHERE user_id = auth.uid()
    ))
); 