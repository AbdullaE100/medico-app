-- Create forum notifications table
CREATE TABLE IF NOT EXISTS forum_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('new_discussion', 'new_reply', 'mention', 'discussion_like', 'reply_like')),
  content TEXT NOT NULL,
  related_id TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_forum_notifications_user ON forum_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_notifications_is_read ON forum_notifications(is_read);

-- RLS policies for forum notifications
ALTER TABLE forum_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY forum_notifications_select_policy 
  ON forum_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (for marking as read)
CREATE POLICY forum_notifications_update_policy 
  ON forum_notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to send notifications when users reply to discussions
CREATE OR REPLACE FUNCTION send_discussion_reply_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the discussion author
  INSERT INTO forum_notifications (
    user_id,
    actor_id,
    actor_name,
    type,
    content,
    related_id
  )
  SELECT 
    d.user_id, -- discussion author receives the notification
    NEW.user_id, -- commenter is the actor
    (SELECT full_name FROM profiles WHERE id = NEW.user_id),
    'new_reply',
    'replied to your discussion "' || LEFT(d.title, 30) || (CASE WHEN LENGTH(d.title) > 30 THEN '...' ELSE '' END) || '"',
    d.id::text -- related_id is the discussion id
  FROM discussions d
  WHERE d.id = NEW.discussion_id AND d.user_id != NEW.user_id; -- Don't notify if replying to own discussion
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to send notifications for new replies
CREATE TRIGGER discussion_reply_notification_trigger
AFTER INSERT ON discussion_comments
FOR EACH ROW
EXECUTE FUNCTION send_discussion_reply_notification(); 