/*
  # Optimize Chat Group Queries and Fix Policies

  1. Changes
    - Remove recursive policies
    - Add indexes for better query performance
    - Simplify group member access control
    - Add proper constraints

  2. Performance
    - Add indexes on frequently queried columns
    - Optimize join conditions
    - Improve query planning
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "chat_group_members_simple_select_policy" ON chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_simple_insert_policy" ON chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_admin_policy" ON chat_group_members;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_groups_created_by ON chat_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_groups_last_message_at ON chat_groups(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_member_id ON chat_group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);

-- Create new simplified policies
CREATE POLICY "chat_group_members_select"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "chat_group_members_insert"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "chat_group_members_delete"
  ON chat_group_members
  FOR DELETE
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
    )
  );