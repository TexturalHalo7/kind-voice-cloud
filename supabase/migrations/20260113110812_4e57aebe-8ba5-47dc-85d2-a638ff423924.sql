-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Voice messages are viewable by everyone" ON public.voice_messages;

-- Create a more restrictive policy - only authenticated users can view voice messages
CREATE POLICY "Authenticated users can view voice messages"
ON public.voice_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);