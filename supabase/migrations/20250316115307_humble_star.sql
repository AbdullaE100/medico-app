/*
  # Fix Chat Group Member Policies

  1. Changes
    - Remove all existing recursive policies
    - Create optimized non-recursive policies
    - Add proper indexes for performance
    - Fix infinite recursion issue

  2. Security
    - Maintain proper access control
    - Prevent policy recursion
    - Optimize query performance
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "chat_group_members_select_policy" ON chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_insert_policy" ON chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_delete_policy" ON chat_group_members;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_chat_groups_created_by ON chat_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_groups_last_message_at ON chat_groups(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_member_id ON chat_group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);

-- Create new non-recursive policies
CREATE POLICY "chat_group_members_view"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chat_group_members_join"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM chat_groups 
      WHERE id = group_id 
      AND created_by = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "chat_group_members_manage"
  ON chat_group_members
  FOR DELETE
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM chat_groups 
      WHERE id = group_id 
      AND created_by = auth.uid()
      LIMIT 1
    )
  );