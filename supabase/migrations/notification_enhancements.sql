/*
  # Enhanced Notifications System
  
  This migration enhances the notification system with:
  1. Updated notification_type enum to include more specific types
  2. Automated triggers for creating notifications for different events
  3. Functions to handle various notification scenarios
*/

-- Alter notification_type enum to include more specific types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_request_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'suggested_connection';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_reply';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_mention';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'post_like';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'direct_message';

-- Create table for user push tokens if it doesn't exist
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  push_token text NOT NULL,
  device_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, push_token)
);

-- Enable RLS on user_push_tokens
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_push_tokens
CREATE POLICY "Users can view their own push tokens"
  ON user_push_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own push tokens"
  ON user_push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own push tokens"
  ON user_push_tokens
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id uuid,
  p_type notification_type,
  p_title text,
  p_content text,
  p_data jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    recipient_id,
    type,
    title,
    content,
    data
  ) VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_content,
    p_data
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle connection request notifications
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name text;
BEGIN
  -- Get requester name
  SELECT full_name INTO v_requester_name
  FROM profiles
  WHERE id = NEW.requester_id;
  
  -- Create notification for the recipient
  PERFORM create_notification(
    NEW.recipient_id,
    'connection_request_received',
    'New Connection Request',
    v_requester_name || ' has sent you a connection request',
    jsonb_build_object(
      'requester_id', NEW.requester_id,
      'connection_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for connection requests
DROP TRIGGER IF EXISTS notify_connection_request_trigger ON connection_requests;
CREATE TRIGGER notify_connection_request_trigger
  AFTER INSERT ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();

-- Function to handle accepted connection notifications
CREATE OR REPLACE FUNCTION notify_connection_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_name text;
  v_requester_id uuid;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Get recipient name and requester ID
    SELECT full_name, requester_id INTO v_recipient_name, v_requester_id
    FROM profiles, connection_requests
    WHERE profiles.id = NEW.recipient_id AND connection_requests.id = NEW.id;
    
    -- Create notification for the requester
    PERFORM create_notification(
      v_requester_id,
      'connection_accepted',
      'Connection Accepted',
      v_recipient_name || ' accepted your connection request',
      jsonb_build_object(
        'recipient_id', NEW.recipient_id,
        'connection_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for accepted connections
DROP TRIGGER IF EXISTS notify_connection_accepted_trigger ON connection_requests;
CREATE TRIGGER notify_connection_accepted_trigger
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_accepted();

-- Function to handle post reply notifications
CREATE OR REPLACE FUNCTION notify_post_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_post_title text;
  v_author_id uuid;
  v_replier_name text;
BEGIN
  -- Skip if author is replying to their own post
  IF NEW.author_id = (SELECT author_id FROM discussions WHERE id = NEW.discussion_id) THEN
    RETURN NEW;
  END IF;
  
  -- Get post information
  SELECT title, author_id INTO v_post_title, v_author_id
  FROM discussions
  WHERE id = NEW.discussion_id;
  
  -- Get replier name
  SELECT full_name INTO v_replier_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Create notification for the post author
  PERFORM create_notification(
    v_author_id,
    'post_reply',
    'New Reply to Your Post',
    v_replier_name || ' replied to your post: ' || v_post_title,
    jsonb_build_object(
      'discussion_id', NEW.discussion_id,
      'comment_id', NEW.id,
      'replier_id', NEW.author_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post replies
DROP TRIGGER IF EXISTS notify_post_reply_trigger ON discussion_comments;
CREATE TRIGGER notify_post_reply_trigger
  AFTER INSERT ON discussion_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_reply();

-- Function to handle post like notifications
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_title text;
  v_author_id uuid;
  v_liker_name text;
BEGIN
  -- Skip if author is liking their own post
  SELECT title, author_id INTO v_post_title, v_author_id
  FROM discussions
  WHERE id = NEW.discussion_id;
  
  IF NEW.user_id = v_author_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker name
  SELECT full_name INTO v_liker_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Only notify for upvotes
  IF NEW.vote_type = 'upvote' THEN
    -- Create notification for the post author
    PERFORM create_notification(
      v_author_id,
      'post_like',
      'Someone Liked Your Post',
      v_liker_name || ' liked your post: ' || v_post_title,
      jsonb_build_object(
        'discussion_id', NEW.discussion_id,
        'liker_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post likes
DROP TRIGGER IF EXISTS notify_post_like_trigger ON discussion_votes;
CREATE TRIGGER notify_post_like_trigger
  AFTER INSERT ON discussion_votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- Function to handle direct message notifications
CREATE OR REPLACE FUNCTION notify_direct_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name text;
BEGIN
  -- Skip system messages
  IF NEW.is_system_message THEN
    RETURN NEW;
  END IF;
  
  -- Get sender name
  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification for the recipient
  PERFORM create_notification(
    NEW.recipient_id,
    'direct_message',
    'New Message',
    v_sender_name || ': ' || substring(NEW.content from 1 for 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END,
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'chat_id', NEW.chat_id,
      'message_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for direct messages
DROP TRIGGER IF EXISTS notify_direct_message_trigger ON messages;
CREATE TRIGGER notify_direct_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_direct_message();

-- Create function to handle mentions in posts and comments
CREATE OR REPLACE FUNCTION process_mentions() 
RETURNS trigger AS $$
DECLARE
  mention text;
  mentioned_user_id uuid;
  mentioner_name text;
  content_excerpt text;
  v_title text;
  v_type text;
BEGIN
  -- Get mentioner name
  SELECT full_name INTO mentioner_name FROM profiles WHERE id = NEW.author_id;
  
  -- Determine if this is a discussion or comment
  IF TG_TABLE_NAME = 'discussions' THEN
    v_title := NEW.title;
    v_type := 'discussion';
    content_excerpt := substring(NEW.content from 1 for 100);
  ELSE
    v_title := (SELECT title FROM discussions WHERE id = NEW.discussion_id);
    v_type := 'comment';
    content_excerpt := substring(NEW.content from 1 for 100);
  END IF;
  
  -- Extract mentions (usernames after @)
  FOR mention IN
    SELECT unnest(regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g'))
  LOOP
    -- Find the mentioned user
    SELECT id INTO mentioned_user_id 
    FROM profiles 
    WHERE username = mention;
    
    -- Create notification if user exists and is not the author
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
      PERFORM create_notification(
        mentioned_user_id,
        'post_mention',
        'You were mentioned',
        mentioner_name || ' mentioned you in a ' || v_type || ': ' || v_title,
        jsonb_build_object(
          'mentioner_id', NEW.author_id,
          'content_excerpt', content_excerpt,
          'discussion_id', CASE WHEN TG_TABLE_NAME = 'discussions' THEN NEW.id ELSE NEW.discussion_id END,
          'comment_id', CASE WHEN TG_TABLE_NAME = 'discussion_comments' THEN NEW.id ELSE NULL END
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for mentions in discussions and comments
DROP TRIGGER IF EXISTS process_mentions_in_discussions ON discussions;
CREATE TRIGGER process_mentions_in_discussions
  AFTER INSERT OR UPDATE OF content ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION process_mentions();

DROP TRIGGER IF EXISTS process_mentions_in_comments ON discussion_comments;
CREATE TRIGGER process_mentions_in_comments
  AFTER INSERT OR UPDATE OF content ON discussion_comments
  FOR EACH ROW
  EXECUTE FUNCTION process_mentions();

-- Create function for suggested connections
CREATE OR REPLACE FUNCTION generate_suggested_connections()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  suggested_user_record RECORD;
  already_connected boolean;
  request_exists boolean;
BEGIN
  -- For each user in the system
  FOR user_record IN (SELECT id, specialty, location FROM profiles WHERE specialty IS NOT NULL OR location IS NOT NULL)
  LOOP
    -- Find potential matches with same specialty or location
    FOR suggested_user_record IN (
      SELECT id, full_name FROM profiles 
      WHERE id != user_record.id 
        AND (
          (specialty = user_record.specialty AND specialty IS NOT NULL) OR 
          (location = user_record.location AND location IS NOT NULL)
        )
      LIMIT 3
    )
    LOOP
      -- Check if already connected
      SELECT EXISTS(
        SELECT 1 FROM connections 
        WHERE (user1_id = user_record.id AND user2_id = suggested_user_record.id) OR
              (user1_id = suggested_user_record.id AND user2_id = user_record.id)
      ) INTO already_connected;
      
      -- Check if connection request already exists
      SELECT EXISTS(
        SELECT 1 FROM connection_requests 
        WHERE (requester_id = user_record.id AND recipient_id = suggested_user_record.id) OR
              (requester_id = suggested_user_record.id AND recipient_id = user_record.id)
      ) INTO request_exists;
      
      -- If not connected and no pending request, create suggestion notification
      IF NOT already_connected AND NOT request_exists THEN
        PERFORM create_notification(
          user_record.id,
          'suggested_connection',
          'Suggested Connection',
          'You might want to connect with ' || suggested_user_record.full_name,
          jsonb_build_object(
            'suggested_user_id', suggested_user_record.id
          )
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule job to generate suggested connections weekly
SELECT cron.schedule(
  'weekly-connection-suggestions',
  '0 9 * * 1', -- 9 AM every Monday
  $$SELECT generate_suggested_connections()$$
); 