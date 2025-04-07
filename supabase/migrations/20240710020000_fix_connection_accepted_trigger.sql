/*
  # Fix for Connection Request Acceptance

  1. Changes
    - Add a trigger to handle connection request acceptance
    - Automatically create the reciprocal follow relationship
    - Respect RLS policies by using security definer function
    - Add trigger to handle unfollowing reciprocally
    - Add RPC function for accepting connections securely

  2. Security
    - Functions are defined with SECURITY DEFINER to bypass RLS
    - Only fires when expected conditions are met
    - Only adds/removes doctor_follows entries as needed
*/

-- First, check if the functions already exist and drop them if they do
DROP FUNCTION IF EXISTS handle_accepted_connection() CASCADE;
DROP FUNCTION IF EXISTS handle_doctor_unfollow() CASCADE;
DROP FUNCTION IF EXISTS accept_connection(uuid) CASCADE;

-- Create a function to handle connection acceptance
CREATE OR REPLACE FUNCTION handle_accepted_connection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status != 'accepted' OR OLD.status IS NULL) THEN
    -- Add follow relationships in both directions, bypassing RLS
    INSERT INTO doctor_follows (follower_id, following_id)
    VALUES 
      (NEW.sender_id, NEW.receiver_id),
      (NEW.receiver_id, NEW.sender_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle reciprocal unfollowing
CREATE OR REPLACE FUNCTION handle_doctor_unfollow()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user unfollows someone, also remove the reciprocal relationship
  DELETE FROM doctor_follows
  WHERE follower_id = OLD.following_id 
    AND following_id = OLD.follower_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an RPC function to accept connections securely
CREATE OR REPLACE FUNCTION accept_connection(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid;
  v_receiver_id uuid;
  v_current_user_id uuid;
BEGIN
  -- Get the current user's ID
  v_current_user_id := auth.uid();

  -- First, verify the connection request exists and the user is authorized
  SELECT sender_id, receiver_id 
  INTO v_sender_id, v_receiver_id
  FROM connection_requests
  WHERE id = p_request_id
    AND (sender_id = v_current_user_id OR receiver_id = v_current_user_id)
    AND status = 'pending';

  -- If no record found or user not authorized, raise exception
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Connection request not found or not authorized';
  END IF;

  -- Update the connection request status
  UPDATE connection_requests
  SET status = 'accepted'
  WHERE id = p_request_id;

  -- Create follow relationships in both directions
  INSERT INTO doctor_follows (follower_id, following_id)
  VALUES 
    (v_sender_id, v_receiver_id),
    (v_receiver_id, v_sender_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create or replace the triggers
DROP TRIGGER IF EXISTS on_connection_accepted ON connection_requests;
DROP TRIGGER IF EXISTS on_doctor_unfollow ON doctor_follows;

CREATE TRIGGER on_connection_accepted
AFTER UPDATE ON connection_requests
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION handle_accepted_connection();

CREATE TRIGGER on_doctor_unfollow
AFTER DELETE ON doctor_follows
FOR EACH ROW
EXECUTE FUNCTION handle_doctor_unfollow();

-- Add comments to the functions for documentation
COMMENT ON FUNCTION handle_accepted_connection() IS 
'Creates reciprocal follow relationships automatically when a connection request is accepted. 
Uses SECURITY DEFINER to bypass RLS policies.';

COMMENT ON FUNCTION handle_doctor_unfollow() IS
'Removes the reciprocal follow relationship when a user unfollows someone.
Uses SECURITY DEFINER to bypass RLS policies.';

COMMENT ON FUNCTION accept_connection(uuid) IS 
'RPC function to accept a connection request and create follow relationships in both directions.
Uses SECURITY DEFINER to bypass RLS policies.'; 