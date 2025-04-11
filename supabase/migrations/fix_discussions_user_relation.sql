-- Fix discussion_votes and discussion_bookmarks tables
-- to ensure consistent references between profiles and user_id

-- Fix discussions table
ALTER TABLE IF EXISTS discussions
DROP CONSTRAINT IF EXISTS discussions_author_id_fkey;

ALTER TABLE IF EXISTS discussions
ADD CONSTRAINT discussions_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS discussion_votes
DROP CONSTRAINT IF EXISTS discussion_votes_user_id_fkey;

ALTER TABLE IF EXISTS discussion_bookmarks
DROP CONSTRAINT IF EXISTS discussion_bookmarks_user_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE IF EXISTS discussion_votes
ADD CONSTRAINT discussion_votes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS discussion_bookmarks
ADD CONSTRAINT discussion_bookmarks_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix discussion_comments
ALTER TABLE IF EXISTS discussion_comments
DROP CONSTRAINT IF EXISTS discussion_comments_author_id_fkey;

ALTER TABLE IF EXISTS discussion_comments
ADD CONSTRAINT discussion_comments_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_user_id ON discussion_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_bookmarks_user_id ON discussion_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_id ON discussion_comments(author_id); 