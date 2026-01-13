-- Add DELETE policy so users can delete their own voice messages
CREATE POLICY "Users can delete their own voice messages"
ON public.voice_messages
FOR DELETE
USING (auth.uid() = user_id);