-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options {text, votes, voters}
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  "totalVotes" INTEGER DEFAULT 0,
  voters TEXT[] DEFAULT '{}',
  "isActive" BOOLEAN DEFAULT TRUE,
  UNIQUE(post_id)
);

-- Add RLS policies
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read polls
CREATE POLICY "Allow anyone to read polls"
  ON public.polls
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to create polls
CREATE POLICY "Allow authenticated users to create polls"
  ON public.polls
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow users to update votes on polls
CREATE POLICY "Allow users to update poll votes"
  ON public.polls
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for quick lookup by post_id
CREATE INDEX IF NOT EXISTS polls_post_id_idx ON public.polls(post_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.polls TO authenticated; 