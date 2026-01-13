-- Drop the current policy
DROP POLICY IF EXISTS "Authenticated users can view voice messages" ON public.voice_messages;

-- Create a more restrictive policy - users can only view:
-- 1. Their own messages
-- 2. Messages they've favorited
-- 3. Messages linked to their conversations
CREATE POLICY "Users can view relevant voice messages"
ON public.voice_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Own messages
    auth.uid() = user_id
    OR
    -- Messages they've favorited
    EXISTS (
      SELECT 1 FROM public.favorites
      WHERE favorites.voice_message_id = voice_messages.id
      AND favorites.user_id = auth.uid()
    )
    OR
    -- Messages linked to their conversations
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.original_voice_message_id = voice_messages.id
      AND (conversations.participant_one_id = auth.uid() OR conversations.participant_two_id = auth.uid())
    )
  )
);

-- Create a secure function for the random message player
-- This returns random messages for the community feature
CREATE OR REPLACE FUNCTION public.get_random_voice_messages(
  category_filter text DEFAULT 'all',
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  audio_url text,
  category text,
  thanks_count integer,
  duration_seconds integer,
  created_at timestamptz,
  username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    vm.id,
    vm.user_id,
    vm.audio_url,
    vm.category,
    vm.thanks_count,
    vm.duration_seconds,
    vm.created_at,
    p.username
  FROM public.voice_messages vm
  JOIN public.profiles p ON p.user_id = vm.user_id
  WHERE (category_filter = 'all' OR vm.category = category_filter)
  ORDER BY random()
  LIMIT limit_count;
$$;