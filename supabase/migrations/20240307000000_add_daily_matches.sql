-- Enable pgcron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing table if it exists
DROP TABLE IF EXISTS daily_matches;

-- Create function to get date from timestamp
CREATE OR REPLACE FUNCTION get_date_from_timestamp(ts TIMESTAMPTZ)
RETURNS DATE
IMMUTABLE
LANGUAGE SQL
AS $$
  SELECT timezone('UTC', ts)::date;
$$;

-- Create daily_matches table
CREATE TABLE daily_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  proposed_time TIMESTAMPTZ NOT NULL,
  compatibility INTEGER NOT NULL,
  status TEXT CHECK (status IN ('accepted', 'denied', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index for one match per user pair per day
CREATE UNIQUE INDEX unique_daily_match 
ON daily_matches (user_id, matched_user_id, get_date_from_timestamp(created_at));

-- Enable RLS
ALTER TABLE daily_matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily matches"
  ON daily_matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily matches"
  ON daily_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily matches"
  ON daily_matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to clean up old matches
CREATE OR REPLACE FUNCTION clean_old_matches()
RETURNS void AS $$
BEGIN
  DELETE FROM daily_matches
  WHERE get_date_from_timestamp(created_at) < get_date_from_timestamp(CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule(
  'cleanup-old-matches',
  '0 0 * * *',
  $$SELECT clean_old_matches()$$
); 