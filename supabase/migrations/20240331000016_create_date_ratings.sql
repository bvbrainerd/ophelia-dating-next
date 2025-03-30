-- Create date_ratings table
CREATE TABLE IF NOT EXISTS date_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_request_id UUID REFERENCES date_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    person_rating INTEGER CHECK (person_rating >= 1 AND person_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date_request_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_date_ratings_date_request_id ON date_ratings(date_request_id);
CREATE INDEX IF NOT EXISTS idx_date_ratings_user_id ON date_ratings(user_id);

-- Enable RLS
ALTER TABLE date_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view ratings for their dates"
ON date_ratings FOR SELECT
USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
        SELECT sender_id FROM date_requests WHERE id = date_request_id
        UNION
        SELECT receiver_id FROM date_requests WHERE id = date_request_id
    )
);

CREATE POLICY "Users can rate their own dates"
ON date_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON date_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON date_ratings TO authenticated; 