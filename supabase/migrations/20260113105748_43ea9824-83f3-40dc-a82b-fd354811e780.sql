-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all thanks" ON public.message_thanks;

-- Create a more restrictive policy - authenticated users can only view:
-- 1. Thanks they've given
-- 2. Thanks on their own voice messages
CREATE POLICY "Users can view relevant thanks"
ON public.message_thanks
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.voice_messages
      WHERE voice_messages.id = message_thanks.voice_message_id
      AND voice_messages.user_id = auth.uid()
    )
  )
);