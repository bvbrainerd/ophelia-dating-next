-- Add privacy settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private'));

-- Create groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create group members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

-- Create group invites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    inviter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns to user_challenges table
ALTER TABLE public.user_challenges
ADD COLUMN IF NOT EXISTS venue text,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS has_posted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS venue_review text,
ADD COLUMN IF NOT EXISTS date_review text,
ADD COLUMN IF NOT EXISTS venue_rating integer CHECK (venue_rating >= 1 AND venue_rating <= 5),
ADD COLUMN IF NOT EXISTS date_rating integer CHECK (date_rating >= 1 AND date_rating <= 5),
ADD COLUMN IF NOT EXISTS last_notification_time timestamp with time zone;

-- Create date_locations table
CREATE TABLE IF NOT EXISTS public.date_locations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
    venue_name text NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on date_locations
ALTER TABLE public.date_locations ENABLE ROW LEVEL SECURITY;

-- Create policy for date_locations
CREATE POLICY "Users can view date locations from their groups"
    ON public.date_locations
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = date_locations.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Add notification settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"date_reminders": true}'::jsonb;

-- Add constraint after column is created
ALTER TABLE public.user_challenges
DROP CONSTRAINT IF EXISTS user_challenges_visibility_check,
ADD CONSTRAINT user_challenges_visibility_check CHECK (visibility IN ('public', 'private'));

-- Drop the existing live_dates view
DROP VIEW IF EXISTS public.live_dates;

-- Recreate the live_dates view with visibility and group_id
CREATE VIEW public.live_dates AS
SELECT 
    uc.id,
    uc.venue,
    uc.created_at,
    uc.watcher_votes,
    dc.title as challenge_title,
    uc.user_id,
    p.first_name,
    p.avatar_url,
    dc.points as challenge_points,
    dr.latitude,
    dr.longitude,
    uc.visibility,
    uc.group_id
FROM public.user_challenges uc
JOIN public.profiles p ON uc.user_id = p.id
JOIN public.date_challenges dc ON uc.challenge_id = dc.id
LEFT JOIN public.date_requests dr ON dr.sender_id = uc.user_id;

-- Enable RLS on tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view their invites" ON public.group_invites;
DROP POLICY IF EXISTS "Users can manage their invites" ON public.group_invites;
DROP POLICY IF EXISTS "Users can view public dates or dates from their groups" ON public.user_challenges;

-- Create policies
CREATE POLICY "Users can view groups they are members of"
    ON public.groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can update their groups"
    ON public.groups
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

CREATE POLICY "Users can view group members"
    ON public.group_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can manage members"
    ON public.group_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_members.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

CREATE POLICY "Users can view their invites"
    ON public.group_invites
    FOR SELECT
    USING (
        invitee_id = auth.uid() OR
        inviter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invites.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

CREATE POLICY "Users can manage their invites"
    ON public.group_invites
    FOR ALL
    USING (
        invitee_id = auth.uid() OR
        inviter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invites.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- Add RLS policy to user_challenges for privacy
CREATE POLICY "Users can view public dates or dates from their groups"
    ON public.user_challenges
    FOR SELECT
    USING (
        visibility = 'public' OR
        (
            visibility = 'private' AND
            (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.group_members
                    WHERE group_members.group_id = user_challenges.group_id
                    AND group_members.user_id = auth.uid()
                )
            )
        )
    ); 