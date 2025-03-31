-- Create couple_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS couple_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(token),
    UNIQUE(inviter_id, partner_email)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_couple_invitations_inviter_id ON couple_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_couple_invitations_partner_email ON couple_invitations(partner_email);
CREATE INDEX IF NOT EXISTS idx_couple_invitations_token ON couple_invitations(token);
CREATE INDEX IF NOT EXISTS idx_couple_invitations_status ON couple_invitations(status);

-- Enable Row Level Security
ALTER TABLE couple_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own invitations"
    ON couple_invitations FOR SELECT
    USING (
        auth.uid() = inviter_id OR 
        partner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can create invitations"
    ON couple_invitations FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update their own invitations"
    ON couple_invitations FOR UPDATE
    USING (
        auth.uid() = inviter_id OR 
        partner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Grant permissions to authenticated users
GRANT ALL ON couple_invitations TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_couple_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_couple_invitations_updated_at
    BEFORE UPDATE ON couple_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_couple_invitations_updated_at(); 