-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.notifications;

-- No new INSERT policy needed for regular users since notifications 
-- are created by the increment_thanks_count trigger which runs as SECURITY DEFINER
-- and bypasses RLS. This ensures only the system can create notifications.