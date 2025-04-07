/*
  # Add Anonymous Posting Functionality

  1. Updates
    - Add is_anonymous column to posts table
    - Default value is false
    - Add index for efficient querying

  This enables doctors to post anonymously for sensitive medical discussions
*/

-- Add is_anonymous column to posts table
ALTER TABLE IF EXISTS public.posts 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_posts_is_anonymous ON public.posts(is_anonymous);

-- Update Post interface in TypeScript type definition
COMMENT ON COLUMN public.posts.is_anonymous IS 'Indicates if post is anonymous, hiding author information'; 