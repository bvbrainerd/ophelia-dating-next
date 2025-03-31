-- Create date_likes table
CREATE TABLE IF NOT EXISTS date_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_request_id UUID REFERENCES date_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date_request_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_date_likes_date_request_id ON date_likes(date_request_id);
CREATE INDEX IF NOT EXISTS idx_date_likes_user_id ON date_likes(user_id);

-- Enable RLS
ALTER TABLE date_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON date_likes FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON date_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users"
ON date_likes FOR DELETE
USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, DELETE ON date_likes TO authenticated; 