-- Create a table for voice message requests
CREATE TABLE public.voice_message_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  recipient_id UUID,
  topic TEXT NOT NULL,
  is_fulfilled BOOLEAN NOT NULL DEFAULT false,
  fulfilled_by UUID,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.voice_message_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests made to them or by them
CREATE POLICY "Users can view their own requests"
ON public.voice_message_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id OR recipient_id IS NULL);

-- Users can create requests
CREATE POLICY "Users can create requests"
ON public.voice_message_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update requests they received (to mark as fulfilled)
CREATE POLICY "Users can fulfill requests"
ON public.voice_message_requests
FOR UPDATE
USING (auth.uid() = recipient_id OR (recipient_id IS NULL AND auth.uid() = fulfilled_by));

-- Enable realtime for requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_message_requests;