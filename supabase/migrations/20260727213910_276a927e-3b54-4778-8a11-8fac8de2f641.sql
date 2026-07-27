CREATE OR REPLACE FUNCTION public.get_total_voice_message_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.voice_messages;
$$;

REVOKE ALL ON FUNCTION public.get_total_voice_message_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_total_voice_message_count() TO anon, authenticated;