
-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create a function to get auth email by username (for login lookup)
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE lower(p.username) = lower(lookup_username)
  LIMIT 1;
$$;

-- Update handle_new_user to store email in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, message_count, monthly_message_count)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    0,
    0
  )
  ON CONFLICT (user_id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$;
