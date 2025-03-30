-- Add columns for both participants
ALTER TABLE user_challenges
ADD COLUMN IF NOT EXISTS participant_one_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS participant_two_id UUID REFERENCES auth.users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_participant_one 
ON user_challenges(participant_one_id);

CREATE INDEX IF NOT EXISTS idx_user_challenges_participant_two 
ON user_challenges(participant_two_id);

-- Update RLS policies to include both participants
DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
CREATE POLICY "Users can view their own challenges"
ON user_challenges FOR SELECT
USING (
    user_id = auth.uid() OR 
    challenger_id = auth.uid() OR
    participant_one_id = auth.uid() OR
    participant_two_id = auth.uid() OR
    (visibility = 'public') OR
    (visibility = 'groups' AND group_ids && (
        SELECT array_agg(group_id) 
        FROM group_members 
        WHERE user_id = auth.uid()
    ))
); 