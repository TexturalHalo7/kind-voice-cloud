-- Add monthly message count column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_message_count integer NOT NULL DEFAULT 0;

-- Update the increment_message_count function to increment both counters
CREATE OR REPLACE FUNCTION public.increment_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET message_count = message_count + 1,
      monthly_message_count = monthly_message_count + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$function$;

-- Create function to reset monthly counts
CREATE OR REPLACE FUNCTION public.reset_monthly_message_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET monthly_message_count = 0,
      updated_at = now();
END;
$function$;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;