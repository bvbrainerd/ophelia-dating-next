-- Add couple_quiz_completed column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS couple_quiz_completed BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_couple_quiz_completed 
ON profiles(couple_quiz_completed);

-- Grant necessary permissions
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO service_role;

-- Add column comment
COMMENT ON COLUMN profiles.couple_quiz_completed IS 'Indicates if the couple has completed their quiz'; 