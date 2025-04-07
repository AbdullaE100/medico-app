/*
  Add is_anonymous column to posts table
  
  This migration adds an is_anonymous boolean column to the posts table
  to support anonymous posting functionality.
*/

-- First check if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'is_anonymous'
  ) THEN
    -- Add the is_anonymous column to the posts table
    ALTER TABLE posts
    ADD COLUMN is_anonymous BOOLEAN DEFAULT false NOT NULL;
    
    -- Add an index for efficient querying
    CREATE INDEX IF NOT EXISTS idx_posts_is_anonymous ON posts(is_anonymous);
    
    -- Add a comment to document the column purpose
    COMMENT ON COLUMN posts.is_anonymous IS 'Indicates if the post is anonymous, hiding author information';
  END IF;
END $$; 