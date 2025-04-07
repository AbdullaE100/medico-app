/*
  # Fix Chat Group Member Policies

  1. Changes
    - Remove recursive policies causing infinite recursion
    - Create simplified, non-recursive policies
    - Add proper indexes for performance
    - Fix group member access control

  2. Security
    - Maintain proper access control without recursion
    - Ensure group privacy
    - Optimize query performance
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "chat_group_members_view" ON chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_join" ON chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_manage" ON chat_group_members;

-- Create optimized indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_member_id ON chat_group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_chat_groups_created_by ON chat_groups(created_by);

-- Create new non-recursive policies
CREATE POLICY "chat_group_members_read"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (
    -- Allow members to view groups they're in
    member_id = auth.uid()
  );

CREATE POLICY "chat_group_members_write"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to join groups or group creators to add members
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "chat_group_members_delete"
  ON chat_group_members
  FOR DELETE
  TO authenticated
  USING (
    -- Allow members to leave or group creators to remove members
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
      LIMIT 1
    )
  );

-- Update chat_groups policies to be non-recursive
DROP POLICY IF EXISTS "Users can view groups they are members of" ON chat_groups;

CREATE POLICY "chat_groups_read"
  ON chat_groups
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access to groups where user is creator or member
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = id
      AND member_id = auth.uid()
      LIMIT 1
    )
  );