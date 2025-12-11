-- Add total_thanks_received to profiles
ALTER TABLE public.profiles ADD COLUMN total_thanks_received integer NOT NULL DEFAULT 0;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  related_message_id uuid REFERENCES public.voice_messages(id) ON DELETE CASCADE,
  from_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "Allow insert for authenticated users"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Update the increment_thanks_count function to also update total and create notification
CREATE OR REPLACE FUNCTION public.increment_thanks_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  message_owner_id uuid;
  thanker_username text;
BEGIN
  -- Get the owner of the voice message
  SELECT user_id INTO message_owner_id FROM public.voice_messages WHERE id = NEW.voice_message_id;
  
  -- Get the username of the person who thanked
  SELECT username INTO thanker_username FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Increment thanks count on the message
  UPDATE public.voice_messages
  SET thanks_count = thanks_count + 1
  WHERE id = NEW.voice_message_id;
  
  -- Increment total thanks received for the message owner
  UPDATE public.profiles
  SET total_thanks_received = total_thanks_received + 1
  WHERE user_id = message_owner_id;
  
  -- Create notification for the message owner (don't notify if thanking own message)
  IF message_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, message, related_message_id, from_user_id)
    VALUES (
      message_owner_id,
      'thank_you',
      thanker_username || ' sent a Thank You for your voice message!',
      NEW.voice_message_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;