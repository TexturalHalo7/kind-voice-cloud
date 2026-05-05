ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_id text NOT NULL DEFAULT 'sun';

DROP FUNCTION IF EXISTS public.get_leaderboard_profiles();
DROP FUNCTION IF EXISTS public.get_random_voice_messages(text, integer);

CREATE FUNCTION public.get_leaderboard_profiles()
 RETURNS TABLE(user_id uuid, username text, message_count integer, monthly_message_count integer, total_thanks_received integer, avatar_id text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.username, p.message_count, p.monthly_message_count, p.total_thanks_received, p.avatar_id
  FROM public.profiles p
  ORDER BY p.message_count DESC
  LIMIT 50;
$$;

CREATE FUNCTION public.get_random_voice_messages(category_filter text DEFAULT 'all'::text, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, user_id uuid, audio_url text, category text, thanks_count integer, duration_seconds integer, created_at timestamp with time zone, username text, avatar_id text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT vm.id, vm.user_id, vm.audio_url, vm.category, vm.thanks_count, vm.duration_seconds, vm.created_at, p.username, p.avatar_id
  FROM public.voice_messages vm
  JOIN public.profiles p ON p.user_id = vm.user_id
  WHERE (category_filter = 'all' OR vm.category = category_filter)
  ORDER BY random()
  LIMIT limit_count;
$$;