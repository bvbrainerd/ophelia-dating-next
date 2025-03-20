-- Add ticket vendor information to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS ticket_vendor text,
ADD COLUMN IF NOT EXISTS vendor_event_id text,
ADD COLUMN IF NOT EXISTS vendor_venue_id text;

-- Create table for storing ticket information
CREATE TABLE IF NOT EXISTS date_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date_id uuid REFERENCES date_requests(id) ON DELETE CASCADE,
    vendor_ticket_id text NOT NULL,
    vendor_name text NOT NULL,
    ticket_details jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster ticket lookups
CREATE INDEX IF NOT EXISTS idx_date_tickets_date_id ON date_tickets(date_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_date_tickets_updated_at ON date_tickets;

-- Create trigger for updating updated_at
CREATE TRIGGER update_date_tickets_updated_at
    BEFORE UPDATE ON date_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE date_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own date tickets" ON date_tickets;

-- Create RLS policy for reading tickets
CREATE POLICY "Users can view their own date tickets"
ON date_tickets FOR SELECT
USING (EXISTS (
    SELECT 1 FROM date_requests dr
    WHERE dr.id = date_tickets.date_id
    AND (dr.sender_id = auth.uid() OR dr.receiver_id = auth.uid())
)); 