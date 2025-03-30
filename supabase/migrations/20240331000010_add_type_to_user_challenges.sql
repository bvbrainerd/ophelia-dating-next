-- Add type column to user_challenges table
ALTER TABLE user_challenges
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_type 
ON user_challenges(type);

-- Update RLS policies to include type column
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