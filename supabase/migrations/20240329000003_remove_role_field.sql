-- First drop the dependent view
DROP VIEW IF EXISTS live_dates;

-- Remove role column and its constraint from profiles table
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check,
DROP COLUMN IF EXISTS role;

-- Recreate the view without the role column
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
    p.challenge_points,
    p.challenge_rank,
    p.challenge_streak
FROM date_requests dr
LEFT JOIN date_challenges dc ON dr.challenge_id = dc.id
LEFT JOIN profiles p ON dr.sender_id = p.id
WHERE dr.status = 'accepted'
ORDER BY dr.created_at DESC; 