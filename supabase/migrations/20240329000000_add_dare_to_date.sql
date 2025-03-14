-- Create enum for challenge levels
CREATE TYPE challenge_level AS ENUM ('beginner', 'adventurous', 'daredevil');

-- Create enum for challenge status
CREATE TYPE challenge_status AS ENUM ('pending', 'committed', 'completed', 'failed', 'cancelled');

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text,
ADD CONSTRAINT profiles_role_check CHECK (role IN ('dater', 'watcher')),
ALTER COLUMN role SET DEFAULT 'dater';

-- Create table for date challenges
CREATE TABLE date_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level challenge_level NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create table for user challenges
CREATE TABLE user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    challenge_id UUID REFERENCES date_challenges(id) NOT NULL,
    date_request_id UUID REFERENCES date_requests(id),
    status challenge_status NOT NULL DEFAULT 'pending',
    points_earned INTEGER DEFAULT 0,
    proof_media_url TEXT,
    watcher_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, challenge_id, date_request_id)
);

-- Create table for challenge watchers
CREATE TABLE challenge_watchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_challenge_id UUID REFERENCES user_challenges(id) NOT NULL,
    watcher_id UUID REFERENCES auth.users(id) NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_challenge_id, watcher_id)
);

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS challenge_rank TEXT DEFAULT 'rookie',
ADD COLUMN IF NOT EXISTS challenge_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_challenge_verified BOOLEAN DEFAULT false;

-- Add new columns to date_requests table
ALTER TABLE date_requests
ADD COLUMN IF NOT EXISTS is_challenge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES date_challenges(id),
ADD COLUMN IF NOT EXISTS challenge_status challenge_status;

-- Insert some initial challenges
INSERT INTO date_challenges (title, description, level, points) VALUES
('Karaoke First Date', 'Sing at least one song together at a karaoke venue', 'beginner', 100),
('Blindfolded Dinner', 'Complete your entire dinner while blindfolded', 'adventurous', 250),
('Adrenaline Rush', 'Go on an extreme sports date (skydiving, bungee jumping, etc.)', 'daredevil', 500),
('Mystery Menu', 'Let your date order your entire meal without knowing what they picked', 'beginner', 150),
('Silent Date', 'Complete your entire date without speaking, using only non-verbal communication', 'adventurous', 300),
('Stranger''s Choice', 'Let a stranger at the venue pick your activities for the next hour', 'daredevil', 400);

-- Create function to update user challenge points
CREATE OR REPLACE FUNCTION update_user_challenge_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update user's challenge points and stats
        UPDATE profiles
        SET 
            challenge_points = challenge_points + NEW.points_earned,
            total_challenges_completed = total_challenges_completed + 1,
            challenge_streak = challenge_streak + 1,
            -- Update rank based on points
            challenge_rank = CASE 
                WHEN challenge_points + NEW.points_earned >= 5000 THEN 'legend'
                WHEN challenge_points + NEW.points_earned >= 2500 THEN 'master'
                WHEN challenge_points + NEW.points_earned >= 1000 THEN 'expert'
                WHEN challenge_points + NEW.points_earned >= 500 THEN 'intermediate'
                ELSE 'rookie'
            END
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating challenge points
CREATE TRIGGER update_challenge_points
AFTER UPDATE ON user_challenges
FOR EACH ROW
EXECUTE FUNCTION update_user_challenge_points();

-- Create function to handle failed challenges
CREATE OR REPLACE FUNCTION handle_failed_challenge()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        -- Reset streak and deduct points
        UPDATE profiles
        SET 
            challenge_streak = 0,
            challenge_points = GREATEST(0, challenge_points - 50)
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling failed challenges
CREATE TRIGGER handle_failed_challenge
AFTER UPDATE ON user_challenges
FOR EACH ROW
EXECUTE FUNCTION handle_failed_challenge(); 