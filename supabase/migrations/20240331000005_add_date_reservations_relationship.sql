-- Create date_reservations table if it doesn't exist
CREATE TABLE IF NOT EXISTS date_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_request_id uuid REFERENCES date_requests(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  date_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_date_reservations_date_request_id ON date_reservations(date_request_id);

-- Enable RLS
ALTER TABLE date_reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own date reservations"
ON date_reservations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM date_requests dr
        WHERE dr.id = date_reservations.date_request_id
        AND (dr.sender_id = auth.uid() OR dr.receiver_id = auth.uid())
    )
);

-- Create venue_bills table if it doesn't exist
CREATE TABLE IF NOT EXISTS venue_bills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_request_id uuid REFERENCES date_requests(id) ON DELETE CASCADE,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  tax decimal(10,2) NOT NULL DEFAULT 0,
  tip decimal(10,2),
  total decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  bill_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_venue_bills_date_request_id ON venue_bills(date_request_id);

-- Enable RLS
ALTER TABLE venue_bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own venue bills"
ON venue_bills FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM date_requests dr
        WHERE dr.id = venue_bills.date_request_id
        AND (dr.sender_id = auth.uid() OR dr.receiver_id = auth.uid())
    )
); 