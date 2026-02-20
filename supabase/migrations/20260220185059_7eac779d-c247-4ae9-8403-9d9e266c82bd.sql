
CREATE POLICY "Users can create notifications they send"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);
