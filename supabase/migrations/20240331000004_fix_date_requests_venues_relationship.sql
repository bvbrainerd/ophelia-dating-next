-- Function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(tbl text, col text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = tbl
        AND column_name = col
    );
END;
$$ LANGUAGE plpgsql;

-- Add venue_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT column_exists('date_requests', 'venue_id') THEN
        ALTER TABLE date_requests ADD COLUMN venue_id uuid;
    END IF;
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE date_requests
DROP CONSTRAINT IF EXISTS date_requests_venue_id_fkey;

-- Add the correct foreign key relationship
ALTER TABLE date_requests
ADD CONSTRAINT date_requests_venue_id_fkey 
    FOREIGN KEY (venue_id) 
    REFERENCES venues(id)
    ON DELETE SET NULL;

-- Create index for better performance
DROP INDEX IF EXISTS idx_date_requests_venue_id;
CREATE INDEX idx_date_requests_venue_id ON date_requests(venue_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own date requests" ON date_requests;
CREATE POLICY "Users can view their own date requests"
ON date_requests FOR SELECT
USING (
    auth.uid() IN (sender_id, receiver_id) OR
    EXISTS (
        SELECT 1 FROM venues v
        WHERE v.id = date_requests.venue_id
    )
); 