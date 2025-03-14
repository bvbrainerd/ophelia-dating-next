-- Add columns to profiles table for dating status and penalties
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dating_status text DEFAULT 'gold' CHECK (dating_status IN ('gold', 'silver', 'bronze', 'penalty')),
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
ADD COLUMN IF NOT EXISTS cancellation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_penalty_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS current_penalty_dare text,
ADD COLUMN IF NOT EXISTS next_date_challenge text;

-- Create table for tracking date cancellations and penalties
CREATE TABLE IF NOT EXISTS public.date_penalties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_request_id uuid REFERENCES public.date_requests(id) ON DELETE CASCADE,
    penalty_type text NOT NULL CHECK (penalty_type IN ('rating_decrease', 'status_decrease', 'dare', 'challenge', 'financial')),
    penalty_details jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at timestamp with time zone,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Create table for tracking user's shame board entries
CREATE TABLE IF NOT EXISTS public.shame_board (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    cancellation_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.date_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shame_board ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own penalties"
    ON public.date_penalties
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create and update penalties"
    ON public.date_penalties
    FOR ALL
    USING (true);

CREATE POLICY "Public can view shame board"
    ON public.shame_board
    FOR SELECT
    USING (true);

CREATE POLICY "System can manage shame board"
    ON public.shame_board
    FOR ALL
    USING (true);

-- Create function to handle date cancellation penalties
CREATE OR REPLACE FUNCTION handle_date_cancellation()
RETURNS trigger AS $$
DECLARE
    current_status text;
    new_status text;
    current_rating numeric;
BEGIN
    -- Get current user status and rating
    SELECT dating_status, rating, cancellation_count 
    INTO current_status, current_rating
    FROM public.profiles 
    WHERE id = OLD.sender_id;

    -- Increment cancellation count
    UPDATE public.profiles 
    SET cancellation_count = cancellation_count + 1
    WHERE id = OLD.sender_id;

    -- Decrease rating
    UPDATE public.profiles 
    SET rating = GREATEST(0, rating - 0.5)
    WHERE id = OLD.sender_id;

    -- Update status based on cancellation count
    new_status := CASE
        WHEN current_status = 'gold' AND cancellation_count >= 3 THEN 'silver'
        WHEN current_status = 'silver' AND cancellation_count >= 5 THEN 'bronze'
        WHEN current_status = 'bronze' AND cancellation_count >= 7 THEN 'penalty'
        ELSE current_status
    END;

    IF new_status != current_status THEN
        UPDATE public.profiles 
        SET dating_status = new_status
        WHERE id = OLD.sender_id;
    END IF;

    -- Create penalty record
    INSERT INTO public.date_penalties (
        user_id,
        date_request_id,
        penalty_type,
        penalty_details
    ) VALUES (
        OLD.sender_id,
        OLD.id,
        'rating_decrease',
        jsonb_build_object(
            'previous_rating', current_rating,
            'new_rating', GREATEST(0, current_rating - 0.5),
            'previous_status', current_status,
            'new_status', new_status
        )
    );

    -- Update shame board
    INSERT INTO public.shame_board (
        user_id,
        week_start,
        cancellation_count
    )
    VALUES (
        OLD.sender_id,
        date_trunc('week', CURRENT_DATE),
        1
    )
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET cancellation_count = shame_board.cancellation_count + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for date cancellations
CREATE TRIGGER on_date_cancellation
    AFTER UPDATE OF status ON public.date_requests
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled')
    EXECUTE FUNCTION handle_date_cancellation(); 