-- Drop the current policy
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;

-- Create a more restrictive policy - users can only view:
-- 1. Their own profile
-- 2. Profiles of users they have direct conversations with
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
  )
);

-- Create a security definer function for leaderboard data
-- This returns limited profile info for public leaderboard display
CREATE OR REPLACE FUNCTION public.get_leaderboard_profiles()
RETURNS TABLE (
  user_id uuid,
  username text,
  message_count integer,
  monthly_message_count integer,
  total_thanks_received integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.message_count,
    p.monthly_message_count,
    p.total_thanks_received
  FROM public.profiles p
  ORDER BY p.message_count DESC
  LIMIT 50;
$$;

-- Create a function to get a specific user's public profile (username only) for voice message display
CREATE OR REPLACE FUNCTION public.get_public_username(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.profiles WHERE user_id = target_user_id;
$$;