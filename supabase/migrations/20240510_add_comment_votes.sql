-- Add comment votes functionality
-- This migration adds a table to track upvotes and downvotes on comments
-- and updates the post_comments table to track vote counts

-- Create comment_votes table
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_upvote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id)
);

-- Add vote_score column to post_comments if it doesn't exist
ALTER TABLE post_comments 
  ADD COLUMN IF NOT EXISTS vote_score INT DEFAULT 0 NOT NULL;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS comment_votes_comment_id_idx ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS comment_votes_user_id_idx ON comment_votes(user_id);

-- Enable row level security
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all comment votes" 
  ON comment_votes FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their own votes" 
  ON comment_votes FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle voting
CREATE OR REPLACE FUNCTION handle_comment_vote(
  p_comment_id UUID,
  p_is_upvote BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_vote RECORD;
  v_vote_change INT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check for existing vote
  SELECT * INTO v_existing_vote
  FROM comment_votes
  WHERE comment_id = p_comment_id AND user_id = v_user_id;
  
  -- Calculate vote change and handle vote
  IF v_existing_vote IS NULL THEN
    -- New vote
    INSERT INTO comment_votes (comment_id, user_id, is_upvote)
    VALUES (p_comment_id, v_user_id, p_is_upvote);
    
    v_vote_change := CASE WHEN p_is_upvote THEN 1 ELSE -1 END;
  ELSIF v_existing_vote.is_upvote = p_is_upvote THEN
    -- Remove vote (toggle off)
    DELETE FROM comment_votes
    WHERE id = v_existing_vote.id;
    
    v_vote_change := CASE WHEN p_is_upvote THEN -1 ELSE 1 END;
  ELSE
    -- Change vote type
    UPDATE comment_votes
    SET is_upvote = p_is_upvote
    WHERE id = v_existing_vote.id;
    
    v_vote_change := CASE WHEN p_is_upvote THEN 2 ELSE -2 END;
  END IF;
  
  -- Update comment vote score
  UPDATE post_comments
  SET vote_score = vote_score + v_vote_change
  WHERE id = p_comment_id;
END;
$$;

-- Function to get user's vote on a comment
CREATE OR REPLACE FUNCTION get_user_comment_vote(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_upvote BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Return null if not authenticated
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get vote information
  SELECT is_upvote INTO v_is_upvote
  FROM comment_votes
  WHERE comment_id = p_comment_id AND user_id = v_user_id;
  
  RETURN v_is_upvote;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_comment_vote(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_comment_vote(UUID) TO authenticated; 