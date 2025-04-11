-- Fix the relationship between discussions and user_id
-- First, drop the function and trigger that use the incorrect field name

DROP TRIGGER IF EXISTS discussion_reply_notification_trigger ON discussion_comments;
DROP FUNCTION IF EXISTS send_discussion_reply_notification();

-- Create a proper function that uses author_id instead of user_id
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
    d.author_id, -- discussion author receives the notification
    NEW.author_id, -- commenter is the actor
    (SELECT full_name FROM profiles WHERE id = NEW.author_id),
    'new_reply',
    'replied to your discussion "' || LEFT(d.title, 30) || (CASE WHEN LENGTH(d.title) > 30 THEN '...' ELSE '' END) || '"',
    d.id::text -- related_id is the discussion id
  FROM discussions d
  WHERE d.id = NEW.discussion_id AND d.author_id != NEW.author_id; -- Don't notify if replying to own discussion
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the corrected function
CREATE TRIGGER discussion_reply_notification_trigger
AFTER INSERT ON discussion_comments
FOR EACH ROW
EXECUTE FUNCTION send_discussion_reply_notification();

-- Also add a view to make compatibility easier for existing code
CREATE OR REPLACE VIEW discussions_with_user_id AS
SELECT 
  d.*,
  d.author_id as user_id
FROM 
  discussions d;

-- Grant permissions on the view
GRANT SELECT ON discussions_with_user_id TO authenticated, anon;

-- Enable RLS on the view if needed
ALTER VIEW discussions_with_user_id SECURITY INVOKER; 