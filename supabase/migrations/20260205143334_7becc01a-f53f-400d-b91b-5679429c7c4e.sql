-- Allow users to delete requests (for fulfillment cleanup)
CREATE POLICY "Users can delete fulfilled requests"
ON public.voice_message_requests
FOR DELETE
USING (
  auth.uid() = requester_id 
  OR (recipient_id IS NULL AND auth.uid() IS NOT NULL)
  OR auth.uid() = recipient_id
);