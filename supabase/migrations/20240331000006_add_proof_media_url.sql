-- Add proof_media_url column to date_requests table
ALTER TABLE date_requests
ADD COLUMN IF NOT EXISTS proof_media_url TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_date_requests_proof_media_url 
ON date_requests(proof_media_url); 