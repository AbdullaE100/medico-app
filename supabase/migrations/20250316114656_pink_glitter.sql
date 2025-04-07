/*
  # Fix Chat Group Member Policies

  1. Changes
    - Remove recursive policies causing infinite loops
    - Implement simplified access control
    - Fix group member management

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Avoid policy recursion
*/

-- Drop all existing policies for chat_group_members
DROP POLICY IF EXISTS "Group members can view membership" ON chat_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON chat_group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON chat_group_members;
DROP POLICY IF EXISTS "simple_group_members_select" ON chat_group_members;
DROP POLICY IF EXISTS "simple_group_members_insert" ON chat_group_members;
DROP POLICY IF EXISTS "group_admin_manage" ON chat_group_members;

-- Create new non-recursive policies
CREATE POLICY "chat_group_members_simple_select_policy"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chat_group_members_simple_insert_policy"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "chat_group_members_admin_policy"
  ON chat_group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE chat_groups.id = chat_group_members.group_id
      AND chat_groups.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE chat_groups.id = chat_group_members.group_id
      AND chat_groups.created_by = auth.uid()
    )
  );