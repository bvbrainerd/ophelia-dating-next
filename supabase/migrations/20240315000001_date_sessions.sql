-- Create date_sessions table
CREATE TABLE IF NOT EXISTS date_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_request_id UUID NOT NULL REFERENCES date_requests(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  dare_assigned_at TIMESTAMP WITH TIME ZONE,
  dare_completed_at TIMESTAMP WITH TIME ZONE,
  dare_id UUID REFERENCES daily_dares(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS date_sessions_date_request_idx ON date_sessions(date_request_id);
CREATE INDEX IF NOT EXISTS date_sessions_status_idx ON date_sessions(status);

-- Add RLS policies
ALTER TABLE date_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own date sessions
CREATE POLICY "Users can read their own date sessions"
ON date_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM date_requests
    WHERE date_requests.id = date_sessions.date_request_id
    AND (date_requests.sender_id = auth.uid() OR date_requests.receiver_id = auth.uid())
  )
);

-- Allow users to insert their own date sessions
CREATE POLICY "Users can insert their own date sessions"
ON date_sessions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM date_requests
    WHERE date_requests.id = NEW.date_request_id
    AND (date_requests.sender_id = auth.uid() OR date_requests.receiver_id = auth.uid())
  )
);

-- Allow users to update their own date sessions
CREATE POLICY "Users can update their own date sessions"
ON date_sessions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM date_requests
    WHERE date_requests.id = date_sessions.date_request_id
    AND (date_requests.sender_id = auth.uid() OR date_requests.receiver_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM date_requests
    WHERE date_requests.id = NEW.date_request_id
    AND (date_requests.sender_id = auth.uid() OR date_requests.receiver_id = auth.uid())
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON date_sessions TO authenticated; 