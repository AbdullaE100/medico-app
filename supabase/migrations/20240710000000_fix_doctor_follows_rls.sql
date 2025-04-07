/*
  Fix RLS policies for doctor_follows table to properly handle connection requests
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create follows" ON doctor_follows;
DROP POLICY IF EXISTS "Users can follow/unfollow" ON doctor_follows;

-- Create a more permissive policy for inserting into doctor_follows
CREATE POLICY "Users can create follows from connection requests"
  ON doctor_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (follower_id, following_id) 
    AND EXISTS (
      SELECT 1 FROM connection_requests
      WHERE (sender_id = follower_id AND receiver_id = following_id)
      OR (sender_id = following_id AND receiver_id = follower_id)
      AND status = 'accepted'
    )
  );

-- Create policy for users to follow others directly (without connection request)
CREATE POLICY "Users can follow others"
  ON doctor_follows
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Ensure users can still delete their follows
CREATE POLICY "Users can delete their follows"
  ON doctor_follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (follower_id, following_id)); 