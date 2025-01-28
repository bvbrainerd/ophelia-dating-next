-- Create daily_matches table
CREATE TABLE daily_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  proposed_time TIMESTAMP WITH TIME ZONE NOT NULL,
  compatibility INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_date DATE DEFAULT CURRENT_DATE
);

-- Create unique index for daily matches
CREATE UNIQUE INDEX unique_daily_match 
ON daily_matches (user_id, matched_user_id, match_date);

-- Enable RLS
ALTER TABLE daily_matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily matches"
  ON daily_matches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create daily matches"
  ON daily_matches
  FOR INSERT
  WITH CHECK (true);

-- Create function to clean up old matches
CREATE OR REPLACE FUNCTION clean_old_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM daily_matches
  WHERE match_date < CURRENT_DATE;
END;
$$;

-- Create a cron job to run cleanup daily at midnight
SELECT cron.schedule(
  'cleanup-old-matches',  -- name of the cron job
  '0 0 * * *',           -- run at midnight every day
  $$SELECT clean_old_matches()$$
); 