-- Drop existing foreign key constraints if they exist
ALTER TABLE date_requests 
DROP CONSTRAINT IF EXISTS date_requests_venue_id_fkey;

-- Add new columns and constraints
ALTER TABLE date_requests
ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scheduled_time timestamptz,
ADD COLUMN IF NOT EXISTS date_id uuid REFERENCES dates(id) ON DELETE SET NULL;

-- Create function to migrate existing data
CREATE OR REPLACE FUNCTION migrate_date_requests()
RETURNS void AS $$
DECLARE
    r RECORD;
    new_venue_id uuid;
    new_date_id uuid;
BEGIN
    FOR r IN SELECT * FROM date_requests WHERE venue IS NOT NULL AND venue_id IS NULL LOOP
        -- Try to find existing venue or create new one
        SELECT id INTO new_venue_id FROM venues WHERE name = r.venue LIMIT 1;
        
        IF new_venue_id IS NULL THEN
            INSERT INTO venues (name, description, location, price_range, cuisine_type)
            VALUES (r.venue, 'Migrated venue', '{}', 2, 'Other')
            RETURNING id INTO new_venue_id;
        END IF;

        -- Create new date entry
        INSERT INTO dates (user_id, venue_id, status, scheduled_time, created_at, updated_at)
        VALUES (r.sender_id, new_venue_id, r.status, COALESCE(r.scheduled_time, r.proposed_time), r.created_at, r.updated_at)
        RETURNING id INTO new_date_id;

        -- Update date_request with new IDs
        UPDATE date_requests
        SET venue_id = new_venue_id,
            date_id = new_date_id,
            scheduled_time = COALESCE(r.scheduled_time, r.proposed_time)
        WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_date_requests();

-- Drop old columns
ALTER TABLE date_requests
DROP COLUMN IF EXISTS venue,
DROP COLUMN IF EXISTS proposed_time;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_date_requests_venue_id ON date_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_date_id ON date_requests(date_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_scheduled_time ON date_requests(scheduled_time);

-- Update RLS policies
ALTER TABLE date_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own date requests" ON date_requests;
CREATE POLICY "Users can view their own date requests" ON date_requests
    FOR SELECT
    USING (auth.uid() IN (sender_id, receiver_id));

DROP POLICY IF EXISTS "Users can update their own date requests" ON date_requests;
CREATE POLICY "Users can update their own date requests" ON date_requests
    FOR UPDATE
    USING (auth.uid() IN (sender_id, receiver_id))
    WITH CHECK (auth.uid() IN (sender_id, receiver_id));

DROP POLICY IF EXISTS "Users can delete their own date requests" ON date_requests;
CREATE POLICY "Users can delete their own date requests" ON date_requests
    FOR DELETE
    USING (auth.uid() IN (sender_id, receiver_id)); 