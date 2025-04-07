/*
  # Fix Chat Group Member Policies

  1. Changes
    - Remove recursive policies
    - Add proper indexes
    - Create simplified policies
    - Fix performance issues

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Optimize query performance
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "chat_group_members_select" ON chat_group_members;
  DROP POLICY IF EXISTS "chat_group_members_insert" ON chat_group_members;
  DROP POLICY IF EXISTS "chat_group_members_delete" ON chat_group_members;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_member_id ON chat_group_members(member_id);

-- Create new non-recursive policies
CREATE POLICY "chat_group_members_select_policy"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "chat_group_members_insert_policy"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "chat_group_members_delete_policy"
  ON chat_group_members
  FOR DELETE
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
      LIMIT 1
    )
  );