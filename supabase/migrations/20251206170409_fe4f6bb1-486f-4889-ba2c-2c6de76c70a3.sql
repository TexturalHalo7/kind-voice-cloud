-- Add streak tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN streak_count integer NOT NULL DEFAULT 0,
ADD COLUMN last_message_date date;

-- Add category to voice_messages
ALTER TABLE public.voice_messages 
ADD COLUMN category text NOT NULL DEFAULT 'general',
ADD COLUMN thanks_count integer NOT NULL DEFAULT 0;

-- Create favorites table
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  voice_message_id uuid NOT NULL REFERENCES public.voice_messages(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, voice_message_id)
);

-- Create thanks table to track who thanked which message (prevent double-thanks)
CREATE TABLE public.message_thanks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  voice_message_id uuid NOT NULL REFERENCES public.voice_messages(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, voice_message_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_thanks ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Message thanks policies
CREATE POLICY "Users can view all thanks"
ON public.message_thanks FOR SELECT
USING (true);

CREATE POLICY "Users can add their own thanks"
ON public.message_thanks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update increment_message_count to handle streaks
CREATE OR REPLACE FUNCTION public.increment_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date date;
  current_streak integer;
BEGIN
  SELECT last_message_date, streak_count INTO last_date, current_streak
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  IF last_date IS NULL OR last_date < CURRENT_DATE - 1 THEN
    -- Reset streak if no previous message or gap > 1 day
    current_streak := 1;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    -- Continue streak
    current_streak := current_streak + 1;
  END IF;
  -- If last_date = CURRENT_DATE, streak stays the same
  
  UPDATE public.profiles
  SET message_count = message_count + 1,
      monthly_message_count = monthly_message_count + 1,
      streak_count = current_streak,
      last_message_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Function to increment thanks count
CREATE OR REPLACE FUNCTION public.increment_thanks_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.voice_messages
  SET thanks_count = thanks_count + 1
  WHERE id = NEW.voice_message_id;
  RETURN NEW;
END;
$$;

-- Trigger for thanks count
CREATE TRIGGER on_message_thanked
  AFTER INSERT ON public.message_thanks
  FOR EACH ROW EXECUTE FUNCTION public.increment_thanks_count();