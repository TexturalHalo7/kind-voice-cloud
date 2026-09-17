CREATE OR REPLACE FUNCTION public.delete_reported_voice_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up dependents so the message row can be removed
  UPDATE public.notifications SET related_message_id = NULL WHERE related_message_id = NEW.voice_message_id;
  UPDATE public.conversations SET original_voice_message_id = NULL WHERE original_voice_message_id = NEW.voice_message_id;
  DELETE FROM public.favorites WHERE voice_message_id = NEW.voice_message_id;
  DELETE FROM public.message_thanks WHERE voice_message_id = NEW.voice_message_id;
  DELETE FROM public.message_ratings WHERE voice_message_id = NEW.voice_message_id;
  DELETE FROM public.voice_messages WHERE id = NEW.voice_message_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_voice_message_reported ON public.voice_message_reports;
CREATE TRIGGER on_voice_message_reported
AFTER INSERT ON public.voice_message_reports
FOR EACH ROW EXECUTE FUNCTION public.delete_reported_voice_message();