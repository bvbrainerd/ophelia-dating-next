-- Create couple_date_requests table
CREATE TABLE couple_date_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    venue TEXT NOT NULL,
    proposed_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE couple_date_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own date requests
CREATE POLICY "Users can view their own date requests"
    ON couple_date_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create their own date requests
CREATE POLICY "Users can create their own date requests"
    ON couple_date_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own date requests
CREATE POLICY "Users can update their own date requests"
    ON couple_date_requests
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Add is_couple_date column to date_requests table if it doesn't exist
ALTER TABLE date_requests 
ADD COLUMN IF NOT EXISTS is_couple_date BOOLEAN DEFAULT FALSE; 