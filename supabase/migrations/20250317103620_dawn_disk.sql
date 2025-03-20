/*
  # Fix Chat Messages Policies and Constraints

  1. Changes
    - Drop all existing policies first
    - Add unique policy names
    - Update constraint and indexes
    - Add message read function

  2. Security
    - Maintain proper access control
    - Ensure message privacy
    - Optimize query performance
*/

-- Drop all existing policies first
DO $$ 
BEGIN
  -- Drop all policies on chat_messages
  DROP POLICY IF EXISTS "Chat participants can send messages" ON chat_messages;
  DROP POLICY IF EXISTS "Chat participants can view messages" ON chat_messages;
  DROP POLICY IF EXISTS "chat_messages_insert_policy_direct" ON chat_messages;
  DROP POLICY IF EXISTS "chat_messages_insert_policy_group" ON chat_messages;
  DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
END $$;

-- Drop existing constraint
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_message_target_check;

-- Add updated constraint with better validation
ALTER TABLE chat_messages
ADD CONSTRAINT chat_message_target_check
CHECK (
  (chat_id IS NOT NULL AND group_id IS NULL) OR 
  (chat_id IS NULL AND group_id IS NOT NULL)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Create new policies with unique names
CREATE POLICY "messages_direct_insert_20250317"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  chat_id IS NOT NULL AND
  group_id IS NULL AND
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_messages.chat_id
    AND (chats.user_id = auth.uid() OR chats.doctor_id = auth.uid())
  )
);

CREATE POLICY "messages_group_insert_20250317"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  group_id IS NOT NULL AND
  chat_id IS NULL AND
  EXISTS (
    SELECT 1 FROM chat_group_members
    WHERE chat_group_members.group_id = chat_messages.group_id
    AND chat_group_members.member_id = auth.uid()
  )
);

CREATE POLICY "messages_select_20250317"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  (
    chat_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND (chats.user_id = auth.uid() OR chats.doctor_id = auth.uid())
    )
  ) OR (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE chat_group_members.group_id = chat_messages.group_id
      AND chat_group_members.member_id = auth.uid()
    )
  )
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_chat_id uuid DEFAULT NULL,
  p_group_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate that exactly one parameter is provided
  IF (p_chat_id IS NULL AND p_group_id IS NULL) OR (p_chat_id IS NOT NULL AND p_group_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Exactly one of p_chat_id or p_group_id must be provided';
  END IF;

  -- Handle direct messages
  IF p_chat_id IS NOT NULL THEN
    -- Verify user has access to the chat
    IF NOT EXISTS (
      SELECT 1 FROM chats
      WHERE id = p_chat_id
      AND (user_id = auth.uid() OR doctor_id = auth.uid())
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;

    -- Mark messages as read
    UPDATE chat_messages
    SET is_read = true
    WHERE chat_id = p_chat_id
    AND sender_id != auth.uid()
    AND NOT is_read;
  END IF;

  -- Handle group messages
  IF p_group_id IS NOT NULL THEN
    -- Verify user is a member of the group
    IF NOT EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = p_group_id
      AND member_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;

    -- Mark messages as read
    UPDATE chat_messages
    SET is_read = true
    WHERE group_id = p_group_id
    AND sender_id != auth.uid()
    AND NOT is_read;
  END IF;
END;
$$;