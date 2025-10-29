-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create voice_messages table
CREATE TABLE public.voice_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on voice_messages
ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;

-- Voice messages policies
CREATE POLICY "Voice messages are viewable by everyone" 
  ON public.voice_messages FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own messages" 
  ON public.voice_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true);

-- Storage policies for audio uploads
CREATE POLICY "Anyone can view voice messages" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'voice-messages');

CREATE POLICY "Authenticated users can upload voice messages" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'voice-messages' 
    AND auth.role() = 'authenticated'
  );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile message count
CREATE OR REPLACE FUNCTION public.increment_message_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET message_count = message_count + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Trigger to increment message count when a voice message is created
CREATE TRIGGER on_voice_message_created
  AFTER INSERT ON public.voice_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_message_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();