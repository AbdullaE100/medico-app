/*
  # Fix Chat Messages Constraint

  1. Changes
    - Update chat_message_target_check constraint
    - Add proper validation for message targets
    - Ensure either chat_id or group_id is set

  2. Security
    - Maintain data integrity
    - Prevent invalid message states
*/

-- Drop existing constraint if it exists
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_message_target_check;

-- Add updated constraint
ALTER TABLE chat_messages
ADD CONSTRAINT chat_message_target_check
CHECK (
  (chat_id IS NOT NULL AND group_id IS NULL) OR
  (chat_id IS NULL AND group_id IS NOT NULL)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON chat_messages(group_id);