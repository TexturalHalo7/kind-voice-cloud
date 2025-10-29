-- Enable realtime for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Enable realtime for voice_messages table  
ALTER TABLE public.voice_messages REPLICA IDENTITY FULL;