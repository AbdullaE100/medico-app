/*
  # Combined Migration for Connection System and Chat Groups

  1. Connection System
    - Connection requests with status tracking
    - Doctor follows for accepted connections
    - Proper follower count management

  2. Chat Groups
    - Group chat support
    - Member management
    - Message handling for groups
*/

-- Drop existing triggers and functions with CASCADE
DROP TRIGGER IF EXISTS update_follower_counts ON doctor_follows CASCADE;
DROP TRIGGER IF EXISTS on_connection_accepted ON connection_requests CASCADE;
DROP TRIGGER IF EXISTS update_chat_trigger ON chat_messages CASCADE;
DROP FUNCTION IF EXISTS update_follower_counts() CASCADE;
DROP FUNCTION IF EXISTS handle_accepted_connection() CASCADE;
DROP FUNCTION IF EXISTS update_chat_on_message() CASCADE;
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid) CASCADE;
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid) CASCADE;

-- Create connection_status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
    CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
END $$;

-- Create doctor follows table
CREATE TABLE IF NOT EXISTS doctor_follows (
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Create connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create chat_groups table
CREATE TABLE IF NOT EXISTS chat_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false,
  is_muted boolean DEFAULT false,
  unread_count integer DEFAULT 0
);

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS chat_group_members (
  group_id uuid REFERENCES chat_groups(id) ON DELETE CASCADE,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, member_id)
);

-- Add group_id to chat_messages if it doesn't exist
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES chat_groups(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE doctor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;

-- Function to handle accepted connections
CREATE OR REPLACE FUNCTION handle_accepted_connection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    -- Add to doctor_follows table in both directions
    INSERT INTO doctor_follows (follower_id, following_id)
    VALUES 
      (NEW.sender_id, NEW.receiver_id),
      (NEW.receiver_id, NEW.sender_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower count for the person being followed
    UPDATE profiles 
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    
    -- Update following count for the follower
    UPDATE profiles 
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower count for the person being unfollowed
    UPDATE profiles 
    SET followers_count = followers_count - 1
    WHERE id = OLD.following_id;
    
    -- Update following count for the unfollower
    UPDATE profiles 
    SET following_count = following_count - 1
    WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update chat on message
CREATE OR REPLACE FUNCTION update_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chat_id IS NOT NULL THEN
    -- Update direct chat
    UPDATE chats
    SET 
      last_message_at = NEW.created_at,
      unread_count = unread_count + 1
    WHERE id = NEW.chat_id;
  ELSIF NEW.group_id IS NOT NULL THEN
    -- Update group chat
    UPDATE chat_groups
    SET 
      last_message_at = NEW.created_at,
      unread_count = unread_count + 1
    WHERE id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_chat_id uuid DEFAULT NULL,
  p_group_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_chat_id IS NOT NULL THEN
    -- Mark direct chat messages as read
    UPDATE chat_messages
    SET is_read = true
    WHERE chat_id = p_chat_id
    AND sender_id != auth.uid()
    AND is_read = false;

    -- Reset direct chat unread count
    UPDATE chats
    SET unread_count = 0
    WHERE id = p_chat_id;
  ELSIF p_group_id IS NOT NULL THEN
    -- Mark group chat messages as read
    UPDATE chat_messages
    SET is_read = true
    WHERE group_id = p_group_id
    AND sender_id != auth.uid()
    AND is_read = false;

    -- Reset group chat unread count
    UPDATE chat_groups
    SET unread_count = 0
    WHERE id = p_group_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION handle_accepted_connection();

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON doctor_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

CREATE TRIGGER update_chat_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_on_message();

-- RLS Policies for doctor follows
CREATE POLICY "Users can view their follows"
  ON doctor_follows
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (follower_id, following_id));

CREATE POLICY "Users can create follows"
  ON doctor_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their follows"
  ON doctor_follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (follower_id, following_id));

-- RLS Policies for connection requests
CREATE POLICY "Users can create connection requests"
  ON connection_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their connection requests"
  ON connection_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can update their received requests"
  ON connection_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (status IN ('accepted', 'rejected'));

-- RLS Policies for chat groups
CREATE POLICY "Users can view groups they are members of"
  ON chat_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = id
      AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON chat_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for chat group members
CREATE POLICY "Group members can view membership"
  ON chat_group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = chat_group_members.group_id
      AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON chat_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());