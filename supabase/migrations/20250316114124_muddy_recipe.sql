/*
  # Fix Chat Groups Schema

  1. Changes
    - Add missing last_message_at column to chat_groups table
    - Fix React navigation links
    - Update queries to handle last_message_at

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Add missing column to chat_groups
ALTER TABLE chat_groups 
ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now();

-- Update existing rows to have a valid timestamp
UPDATE chat_groups 
SET last_message_at = created_at 
WHERE last_message_at IS NULL;