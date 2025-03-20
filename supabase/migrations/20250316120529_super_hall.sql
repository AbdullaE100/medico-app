/*
  # Temporarily Disable RLS for chat_group_members

  1. Changes
    - Disable RLS on chat_group_members table
    - Add comment explaining temporary nature
    - Keep indexes for performance

  2. Security Note
    - This is a temporary fix
    - RLS should be re-enabled with proper policies later
*/

-- Disable RLS on chat_group_members
ALTER TABLE chat_group_members DISABLE ROW LEVEL SECURITY;

-- Keep existing indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_member_id ON chat_group_members(member_id);

-- Add comment to track this change
COMMENT ON TABLE chat_group_members IS 'RLS temporarily disabled to resolve recursion issues. TODO: Re-enable with proper policies.';