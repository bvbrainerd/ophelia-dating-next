-- Add type column to date_challenges if it doesn't exist
ALTER TABLE date_challenges
ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('date_invite', 'date_activity'));

-- Add date_partner_id to user_challenges if it doesn't exist
ALTER TABLE user_challenges
ADD COLUMN IF NOT EXISTS date_partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Drop existing foreign key constraints if they exist
ALTER TABLE user_challenges
DROP CONSTRAINT IF EXISTS user_challenges_date_request_id_fkey;

-- Add the correct foreign key relationship for date_requests
ALTER TABLE user_challenges
ADD CONSTRAINT user_challenges_date_request_id_fkey 
    FOREIGN KEY (date_request_id) 
    REFERENCES date_requests(id)
    ON DELETE SET NULL;

-- Create indexes for the new relationships
CREATE INDEX IF NOT EXISTS idx_user_challenges_date_partner_id ON user_challenges(date_partner_id);

-- Update RLS policies to include date partner access
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