-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_type TEXT NOT NULL CHECK (quiz_type IN ('single', 'couple')),
    answers JSONB NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_type ON quiz_results(quiz_type);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quiz results"
ON quiz_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
ON quiz_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON quiz_results TO authenticated;

-- Update profiles table to handle couple-specific fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS couple_quiz_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS couple_preferences JSONB DEFAULT '{
    "date_frequency": null,
    "preferred_activities": [],
    "social_style": null
}'::jsonb;

-- Add comment for documentation
COMMENT ON TABLE quiz_results IS 'Stores user quiz results for both single and couple quizzes';
COMMENT ON COLUMN quiz_results.answers IS 'JSON object containing quiz answers';
COMMENT ON COLUMN profiles.couple_quiz_completed IS 'Indicates if the couple has completed their quiz';
COMMENT ON COLUMN profiles.couple_preferences IS 'Stores couple-specific preferences from quiz'; 