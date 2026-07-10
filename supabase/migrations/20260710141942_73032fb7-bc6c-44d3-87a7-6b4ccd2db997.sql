
-- 1. Profiles: hide email column from all clients (self can read email from auth session)
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, username, message_count, monthly_message_count,
  streak_count, last_message_date, total_thanks_received,
  avatar_id, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- 2. Revoke EXECUTE on internal SECURITY DEFINER functions from client roles
REVOKE EXECUTE ON FUNCTION public.reset_monthly_message_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_message_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_thanks_count() FROM PUBLIC, anon, authenticated;

-- 3. Storage: replace broad SELECT policy and add owner-scoped INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Anyone can view voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload voice messages" ON storage.objects;

-- Files remain accessible by direct public URL (bucket is public); no broad SELECT policy needed.
-- Allow authenticated users to see their own uploaded objects for listing/management.
CREATE POLICY "Users can view their own voice message files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND starts_with(name, (auth.uid())::text || '-')
);

CREATE POLICY "Users can upload their own voice message files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-messages'
  AND starts_with(name, (auth.uid())::text || '-')
);

CREATE POLICY "Users can update their own voice message files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND starts_with(name, (auth.uid())::text || '-')
)
WITH CHECK (
  bucket_id = 'voice-messages'
  AND starts_with(name, (auth.uid())::text || '-')
);

CREATE POLICY "Users can delete their own voice message files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND starts_with(name, (auth.uid())::text || '-')
);
