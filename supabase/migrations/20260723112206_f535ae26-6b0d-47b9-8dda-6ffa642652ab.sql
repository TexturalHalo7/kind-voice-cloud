
-- Remap legacy categories to new kindness set
UPDATE public.voice_messages SET category = 'you-matter'  WHERE category = 'general';
UPDATE public.voice_messages SET category = 'thank-you'   WHERE category = 'gratitude';
UPDATE public.voice_messages SET category = 'congratulate' WHERE category = 'motivation';
-- 'encouragement' stays

-- Rating enum
DO $$ BEGIN
  CREATE TYPE public.message_rating AS ENUM ('made_my_day','nice','neutral','inappropriate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.message_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_message_id uuid NOT NULL REFERENCES public.voice_messages(id) ON DELETE CASCADE,
  listener_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  rating public.message_rating NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voice_message_id, listener_id)
);

GRANT SELECT, INSERT ON public.message_ratings TO authenticated;
GRANT ALL ON public.message_ratings TO service_role;

ALTER TABLE public.message_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own ratings, not for own messages"
ON public.message_ratings FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = listener_id
  AND auth.uid() <> sender_id
);

CREATE POLICY "Users can view ratings they gave"
ON public.message_ratings FOR SELECT TO authenticated
USING (auth.uid() = listener_id);

CREATE INDEX IF NOT EXISTS message_ratings_message_idx ON public.message_ratings(voice_message_id);
CREATE INDEX IF NOT EXISTS message_ratings_sender_idx  ON public.message_ratings(sender_id);
