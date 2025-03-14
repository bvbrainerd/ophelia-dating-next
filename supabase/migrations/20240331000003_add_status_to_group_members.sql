-- Add status column to group_members table
ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));

-- Create index for status column
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- Update existing rows to have 'active' status
UPDATE group_members SET status = 'active' WHERE status IS NULL; 