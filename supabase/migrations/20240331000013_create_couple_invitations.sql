-- Create enum for invitation status
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create couple_invitations table
CREATE TABLE couple_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES profiles(id) NOT NULL,
    partner_email TEXT NOT NULL,
    token UUID NOT NULL UNIQUE,
    status invitation_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster token lookups
CREATE INDEX idx_couple_invitations_token ON couple_invitations(token);

-- Create index for partner email lookups
CREATE INDEX idx_couple_invitations_partner_email ON couple_invitations(partner_email);

-- Add RLS policies
ALTER TABLE couple_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own invitations (as inviter or invitee)
CREATE POLICY "Users can view their own invitations"
    ON couple_invitations FOR SELECT
    USING (
        auth.uid() = inviter_id OR 
        partner_email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Allow authenticated users to create invitations
CREATE POLICY "Users can create invitations"
    ON couple_invitations FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);

-- Allow users to update their own invitations
CREATE POLICY "Users can update their own invitations"
    ON couple_invitations FOR UPDATE
    USING (
        auth.uid() = inviter_id OR 
        partner_email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_couple_invitations_updated_at
    BEFORE UPDATE ON couple_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 