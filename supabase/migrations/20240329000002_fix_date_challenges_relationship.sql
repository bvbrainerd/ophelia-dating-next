-- Add challenge_id to date_requests if it doesn't exist
ALTER TABLE date_requests
DROP CONSTRAINT IF EXISTS date_requests_challenge_id_fkey;

-- Ensure the challenge_id column exists and has the correct foreign key relationship
ALTER TABLE date_requests
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES date_challenges(id),
ADD COLUMN IF NOT EXISTS watcher_votes INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_date_requests_challenge_id 
ON date_requests(challenge_id);

CREATE INDEX IF NOT EXISTS idx_date_requests_watcher_votes
ON date_requests(watcher_votes DESC);

-- Add RLS policies
ALTER TABLE date_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON date_challenges FOR SELECT
TO authenticated
USING (true);

-- Update views or functions if needed
DROP VIEW IF EXISTS live_dates;
CREATE VIEW live_dates AS
SELECT 
    dr.id,
    dr.venue,
    dr.created_at,
    COALESCE(dr.watcher_votes, 0) as watcher_votes,
    dc.title as challenge_title,
    p.id as user_id,
    p.first_name,
    CASE 
        WHEN p.avatar_url IS NULL OR p.avatar_url = '' THEN '/images/default-avatar.png'
        WHEN p.avatar_url LIKE 'http%' THEN p.avatar_url
        WHEN p.avatar_url LIKE '%.jpg' OR p.avatar_url LIKE '%.jpeg' OR p.avatar_url LIKE '%.png' 
        THEN 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/' || REGEXP_REPLACE(p.avatar_url, '^avatars/', '')
        ELSE '/images/default-avatar.png'
    END as avatar_url,
    p.role,
    p.challenge_points,
    p.challenge_rank,
    p.challenge_streak
FROM date_requests dr
LEFT JOIN date_challenges dc ON dr.challenge_id = dc.id
LEFT JOIN profiles p ON dr.sender_id = p.id
WHERE dr.status = 'accepted'
ORDER BY dr.created_at DESC; 