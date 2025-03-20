-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a backup of the venues table
CREATE TABLE venues_backup AS SELECT * FROM venues;

-- Drop the existing venues table
DROP TABLE IF EXISTS venues CASCADE;

-- Recreate venues table with UUID
CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy data from backup with new UUIDs
-- Only copy columns that exist in the old table, let new columns use their defaults
INSERT INTO venues (name, address, latitude, longitude)
SELECT name, address, latitude, longitude
FROM venues_backup;

-- Drop the backup table
DROP TABLE venues_backup; 