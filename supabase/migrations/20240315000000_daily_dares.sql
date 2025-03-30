-- Create daily_dares table
CREATE TABLE IF NOT EXISTS daily_dares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dare TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'couple')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure only one dare per type per day
  UNIQUE (date, type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS daily_dares_date_type_idx ON daily_dares (date, type);

-- Add RLS policies
ALTER TABLE daily_dares ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read daily dares
CREATE POLICY "Allow authenticated users to read daily dares"
ON daily_dares FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert daily dares if none exists for that date and type
CREATE POLICY "Allow authenticated users to insert daily dares"
ON daily_dares FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM daily_dares d
    WHERE d.date = CAST(CURRENT_DATE AS DATE)
    AND d.type = CAST(current_setting('request.jwt.claims', true)::json->>'type' AS TEXT)
  )
);

-- Allow authenticated users to update their own dares
CREATE POLICY "Allow authenticated users to update daily dares"
ON daily_dares FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete their own dares
CREATE POLICY "Allow authenticated users to delete daily dares"
ON daily_dares FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_dares TO authenticated; 