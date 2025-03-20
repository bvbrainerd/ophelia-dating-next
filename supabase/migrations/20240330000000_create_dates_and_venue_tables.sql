-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's modify the venues table to use UUID
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create date_requests table
CREATE TABLE IF NOT EXISTS date_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  scheduled_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_date_requests_sender_id ON date_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_receiver_id ON date_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_venue_id ON date_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_date_requests_status ON date_requests(status);

-- Enable RLS
ALTER TABLE date_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own date requests"
ON date_requests FOR SELECT
USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can create their own date requests"
ON date_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own date requests"
ON date_requests FOR UPDATE
USING (auth.uid() IN (sender_id, receiver_id));

-- Create dates table first since other tables reference it
CREATE TABLE IF NOT EXISTS dates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  scheduled_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create venue integrations table
CREATE TABLE IF NOT EXISTS venue_integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  payment_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  reservation_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  supported_features text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create venue bills table
CREATE TABLE IF NOT EXISTS venue_bills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  date_id uuid REFERENCES dates(id) ON DELETE CASCADE,
  bill_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  tax decimal(10,2) NOT NULL DEFAULT 0,
  tip decimal(10,2),
  total decimal(10,2) NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Create bill items table
CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id uuid REFERENCES venue_bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  split_between uuid[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'ordered',
  created_at timestamptz DEFAULT now()
);

-- Create bill splits table
CREATE TABLE IF NOT EXISTS bill_splits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id uuid REFERENCES venue_bills(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bill updates table for real-time tracking
CREATE TABLE IF NOT EXISTS bill_updates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  bill_id uuid REFERENCES venue_bills(id) ON DELETE CASCADE,
  update_type text NOT NULL,
  update_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create date reservations table
CREATE TABLE IF NOT EXISTS date_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_id uuid REFERENCES dates(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  reservation_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  party_size integer NOT NULL DEFAULT 2,
  date_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create date payments table
CREATE TABLE IF NOT EXISTS date_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_id uuid REFERENCES dates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id uuid REFERENCES venue_bills(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_id text,
  payment_provider text NOT NULL,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_venue_bills_venue_id ON venue_bills(venue_id);
CREATE INDEX idx_venue_bills_date_id ON venue_bills(date_id);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_bill_splits_bill_id ON bill_splits(bill_id);
CREATE INDEX idx_bill_splits_user_id ON bill_splits(user_id);
CREATE INDEX idx_date_reservations_venue_id ON date_reservations(venue_id);
CREATE INDEX idx_date_reservations_date_id ON date_reservations(date_id);
CREATE INDEX idx_date_payments_date_id ON date_payments(date_id);
CREATE INDEX idx_date_payments_user_id ON date_payments(user_id);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Venues policies
CREATE POLICY "Public venues are viewable by everyone"
  ON venues FOR SELECT
  USING (true);

-- Dates policies
CREATE POLICY "Users can view their own dates"
  ON dates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dates"
  ON dates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dates"
  ON dates FOR UPDATE
  USING (auth.uid() = user_id);

-- Venue integrations policies
CREATE POLICY "Venue admins can manage integrations"
  ON venue_integrations FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM venue_admins WHERE venue_id = venue_integrations.venue_id
  ));

-- Venue bills policies
CREATE POLICY "Users can view their date bills"
  ON venue_bills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dates
    WHERE dates.id = venue_bills.date_id
    AND dates.user_id = auth.uid()
  ));

-- Bill items policies
CREATE POLICY "Users can view their date bill items"
  ON bill_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM venue_bills
    JOIN dates ON dates.id = venue_bills.date_id
    WHERE venue_bills.id = bill_items.bill_id
    AND dates.user_id = auth.uid()
  ));

-- Bill splits policies
CREATE POLICY "Users can view and manage their bill splits"
  ON bill_splits FOR ALL
  USING (auth.uid() = user_id);

-- Create function to update bill totals
CREATE OR REPLACE FUNCTION update_bill_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venue_bills
  SET 
    subtotal = (
      SELECT COALESCE(SUM(price * quantity), 0)
      FROM bill_items
      WHERE bill_id = NEW.bill_id
    ),
    total = (
      SELECT COALESCE(SUM(price * quantity), 0) * (1 + COALESCE(tax, 0) + COALESCE(tip, 0))
      FROM bill_items
      WHERE bill_id = NEW.bill_id
    ),
    last_updated = now()
  WHERE id = NEW.bill_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating bill totals
CREATE TRIGGER update_bill_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON bill_items
FOR EACH ROW
EXECUTE FUNCTION update_bill_totals(); 