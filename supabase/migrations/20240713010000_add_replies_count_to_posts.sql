/*
  Add the replies_count column to the posts table

  This migration adds a replies_count column to the posts table,
  ensuring we can track the number of direct replies to a post,
  separate from comments.
*/

-- First check if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'replies_count'
  ) THEN
    -- Add the replies_count column to the posts table
    ALTER TABLE posts
    ADD COLUMN replies_count INTEGER DEFAULT 0 NOT NULL;

    -- Initialize the replies_count column with the current count of direct replies
    UPDATE posts p
    SET replies_count = (
      SELECT COUNT(*)
      FROM post_comments c
      WHERE c.post_id = p.id AND c.parent_id IS NULL
    );
  END IF;
END $$;

-- Create the function for incrementing replies count
-- This is outside the DO block to avoid nesting issues
CREATE OR REPLACE FUNCTION increment_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment for comments that are direct replies to posts (no parent_id)
  IF NEW.parent_id IS NULL THEN
    UPDATE posts
    SET replies_count = replies_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new comments to update post replies_count
DROP TRIGGER IF EXISTS on_comment_insert_update_post_replies ON post_comments;
CREATE TRIGGER on_comment_insert_update_post_replies
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_replies_count(); 