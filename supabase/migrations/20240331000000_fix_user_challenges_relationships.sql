-- Drop existing foreign key constraints
ALTER TABLE user_challenges
DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey,
DROP CONSTRAINT IF EXISTS user_challenges_challenger_id_fkey,
DROP CONSTRAINT IF EXISTS user_challenges_date_request_id_fkey,
DROP CONSTRAINT IF EXISTS user_challenges_challenge_id_fkey;

-- Add missing columns if they don't exist
ALTER TABLE user_challenges
ADD COLUMN IF NOT EXISTS challenger_id UUID,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proof_type TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS group_ids UUID[];

-- Add the correct foreign key relationships
ALTER TABLE user_challenges
ADD CONSTRAINT user_challenges_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
ADD CONSTRAINT user_challenges_challenger_id_fkey 
    FOREIGN KEY (challenger_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
ADD CONSTRAINT user_challenges_date_request_id_fkey 
    FOREIGN KEY (date_request_id) 
    REFERENCES date_requests(id)
    ON DELETE CASCADE,
ADD CONSTRAINT user_challenges_challenge_id_fkey 
    FOREIGN KEY (challenge_id) 
    REFERENCES date_challenges(id)
    ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenger_id ON user_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_date_request_id ON user_challenges(date_request_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_created_at ON user_challenges(created_at DESC);

-- Update RLS policies
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON user_challenges;

CREATE POLICY "Users can view their own challenges"
ON user_challenges FOR SELECT
USING (
    user_id = auth.uid() OR 
    challenger_id = auth.uid() OR
    (visibility = 'public') OR
    (visibility = 'groups' AND group_ids && (
        SELECT array_agg(group_id) 
        FROM group_members 
        WHERE user_id = auth.uid()
    ))
);

CREATE POLICY "Users can update their own challenges"
ON user_challenges FOR UPDATE
USING (user_id = auth.uid() OR challenger_id = auth.uid()); 