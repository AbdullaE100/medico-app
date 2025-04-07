-- Create tables for comment interactions
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS comment_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, comment_id)
);

-- Add additional columns to post_comments table if they don't exist
ALTER TABLE post_comments 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES post_comments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS reposts_count INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS replies_count INT DEFAULT 0 NOT NULL;

-- Create function to like/unlike a comment
CREATE OR REPLACE FUNCTION like_comment(p_comment_id UUID)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_existing_like UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if like already exists
  SELECT id INTO v_existing_like 
  FROM comment_likes 
  WHERE user_id = v_user_id AND comment_id = p_comment_id;

  IF v_existing_like IS NULL THEN
    -- Create new like
    INSERT INTO comment_likes (user_id, comment_id)
    VALUES (v_user_id, p_comment_id);

    -- Increment likes count
    UPDATE post_comments
    SET likes_count = likes_count + 1
    WHERE id = p_comment_id;
  ELSE
    -- Remove existing like
    DELETE FROM comment_likes
    WHERE id = v_existing_like;

    -- Decrement likes count
    UPDATE post_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = p_comment_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to repost/unrepost a comment
CREATE OR REPLACE FUNCTION repost_comment(p_comment_id UUID, p_content TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_existing_repost UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if repost already exists
  SELECT id INTO v_existing_repost 
  FROM comment_reposts 
  WHERE user_id = v_user_id AND comment_id = p_comment_id;

  IF v_existing_repost IS NULL THEN
    -- Create new repost
    INSERT INTO comment_reposts (user_id, comment_id, content)
    VALUES (v_user_id, p_comment_id, p_content);

    -- Increment reposts count
    UPDATE post_comments
    SET reposts_count = reposts_count + 1
    WHERE id = p_comment_id;
  ELSE
    -- Remove existing repost
    DELETE FROM comment_reposts
    WHERE id = v_existing_repost;

    -- Decrement reposts count
    UPDATE post_comments
    SET reposts_count = GREATEST(0, reposts_count - 1)
    WHERE id = p_comment_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment replies count
CREATE OR REPLACE FUNCTION increment_comment_replies_count(p_comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE post_comments
  SET replies_count = replies_count + 1
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment post comments count
CREATE OR REPLACE FUNCTION increment_post_comments_count(p_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET comments_count = (
    SELECT COUNT(*) 
    FROM post_comments 
    WHERE post_id = p_post_id
  )
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for comment interactions
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reposts ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes
CREATE POLICY comment_likes_select_policy ON comment_likes
  FOR SELECT USING (true);

-- Only authenticated users can insert their own likes
CREATE POLICY comment_likes_insert_policy ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only users can delete their own likes
CREATE POLICY comment_likes_delete_policy ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Anyone can read reposts
CREATE POLICY comment_reposts_select_policy ON comment_reposts
  FOR SELECT USING (true);

-- Only authenticated users can insert their own reposts
CREATE POLICY comment_reposts_insert_policy ON comment_reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only users can delete their own reposts
CREATE POLICY comment_reposts_delete_policy ON comment_reposts
  FOR DELETE USING (auth.uid() = user_id); 