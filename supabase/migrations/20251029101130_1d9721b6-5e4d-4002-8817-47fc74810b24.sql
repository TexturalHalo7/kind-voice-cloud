-- Drop the existing foreign key that points to auth.users
ALTER TABLE voice_messages
DROP CONSTRAINT voice_messages_user_id_fkey;

-- Add the correct foreign key that points to profiles
ALTER TABLE voice_messages
ADD CONSTRAINT voice_messages_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;