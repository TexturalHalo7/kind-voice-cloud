-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more restrictive policy - users can only view:
-- 1. Their own profile
-- 2. Profiles of users they have conversations with
CREATE POLICY "Users can view relevant profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Own profile
    auth.uid() = user_id
    OR
    -- Profiles of conversation participants
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE (
        (conversations.participant_one_id = auth.uid() AND conversations.participant_two_id = profiles.user_id)
        OR
        (conversations.participant_two_id = auth.uid() AND conversations.participant_one_id = profiles.user_id)
      )
    )
    OR
    -- Profiles of users whose voice messages the current user can see (for leaderboard, random player)
    EXISTS (
      SELECT 1 FROM public.voice_messages
      WHERE voice_messages.user_id = profiles.user_id
    )
  )
);