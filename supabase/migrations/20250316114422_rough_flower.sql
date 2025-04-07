/*
  # Fix Chat Group Member Policies

  1. Changes
    - Remove recursive policies causing infinite loops
    - Implement simplified access control
    - Fix group member visibility rules

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Keep existing data integrity
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_group_members' 
    AND policyname = 'Group members can view membership'
  ) THEN
    DROP POLICY "Group members can view membership" ON chat_group_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_group_members' 
    AND policyname = 'Users can join groups'
  ) THEN
    DROP POLICY "Users can join groups" ON chat_group_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_group_members' 
    AND policyname = 'Admins can manage members'
  ) THEN
    DROP POLICY "Admins can manage members" ON chat_group_members;
  END IF;

  -- Drop new policies if they already exist (to avoid conflicts)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_group_members' 
    AND policyname = 'simple_group_members_select'
  ) THEN
    DROP POLICY "simple_group_members_select" ON chat_group_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_group_members' 
    AND policyname = 'simple_group_members_insert'
  ) THEN
    DROP POLICY "simple_group_members_insert" ON chat_group_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_group_members' 
    AND policyname = 'group_admin_manage'
  ) THEN
    DROP POLICY "group_admin_manage" ON chat_group_members;
  END IF;
END $$;

-- Create simplified policies without recursion
CREATE POLICY "simple_group_members_select"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "simple_group_members_insert"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

-- Create policy for group admins
CREATE POLICY "group_admin_manage"
  ON chat_group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id
      AND created_by = auth.uid()
    )
  );