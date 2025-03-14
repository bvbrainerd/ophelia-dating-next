-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS date_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add challenge_id and watcher_votes to date_requests if they don't exist
ALTER TABLE date_requests
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES date_challenges(id),
ADD COLUMN IF NOT EXISTS watcher_votes INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    challenge_id UUID REFERENCES date_challenges(id) NOT NULL,
    date_request_id UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    points_earned INTEGER DEFAULT 0,
    proof_media_url TEXT,
    watcher_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, challenge_id, date_request_id)
);

-- Fix missing columns in profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS challenge_rank TEXT DEFAULT 'rookie',
ADD COLUMN IF NOT EXISTS challenge_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0;

-- Drop existing constraints if they exist
ALTER TABLE user_challenges 
DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey,
DROP CONSTRAINT IF EXISTS user_challenges_date_request_id_fkey;

-- Add foreign key relationships
ALTER TABLE user_challenges
ADD CONSTRAINT user_challenges_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
ADD CONSTRAINT user_challenges_date_request_id_fkey 
    FOREIGN KEY (date_request_id) 
    REFERENCES date_requests(id)
    ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_challenge_points 
    ON profiles(challenge_points DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status 
    ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_created_at 
    ON user_challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_date_requests_status_created 
    ON date_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_date_requests_challenge_id 
    ON date_requests(challenge_id); 