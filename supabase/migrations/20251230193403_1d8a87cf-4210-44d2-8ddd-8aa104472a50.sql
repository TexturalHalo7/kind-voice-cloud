-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_one_id UUID NOT NULL,
  participant_two_id UUID NOT NULL,
  original_voice_message_id UUID REFERENCES public.voice_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE (participant_one_id, participant_two_id)
);

-- Create conversation messages table
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  audio_url TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "Users can create conversations they are part of"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- RLS policies for conversation messages
CREATE POLICY "Users can view messages in their conversations"
ON public.conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
  )
);

CREATE POLICY "Users can update messages they sent or mark as read"
ON public.conversation_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())
  )
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_participant_one ON public.conversations(participant_one_id);
CREATE INDEX idx_conversations_participant_two ON public.conversations(participant_two_id);
CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_sender ON public.conversation_messages(sender_id);

-- Add trigger to update conversation updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;