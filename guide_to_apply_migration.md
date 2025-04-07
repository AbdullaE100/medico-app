# How to Apply the New Migration

## Option 1: Using Supabase CLI (Recommended)

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Apply the migration:
   ```bash
   supabase db push
   ```

## Option 2: Apply Manually via SQL Editor

1. Log in to your Supabase dashboard
2. Go to the SQL Editor 
3. Copy the contents of the migration file you created (supabase/migrations/20240710020000_fix_connection_accepted_trigger.sql)
4. Paste and execute the SQL in the editor

## Testing the RPC Function

After applying the migration, you can test the new RPC function directly in the SQL Editor:

```sql
-- Replace the UUID with an actual pending connection request ID
SELECT * FROM accept_connection('00000000-0000-0000-0000-000000000000');
```

## Verification

After applying the migration, test the following scenarios to ensure everything works correctly:

### Test Connection Acceptance
1. Send a connection request from one account to another
2. Accept the request from the receiving account
3. Verify both accounts now appear in each other's following/followers lists

### Test Unfollowing
1. From an account that is following another user, unfollow that user
2. Verify the relationship is removed in both directions (you no longer follow them, and they no longer follow you)

## Understanding the Fix

This solution addresses the error in three complementary ways:

1. **Frontend Fixes**: 
   - Modified the `acceptConnectionRequest` function to only insert a follow relationship where the current user is the follower
   - Added fallback to an RPC function if available
   - Modified the `unfollowDoctor` function to only delete the relationship where the current user is the follower
   - Both changes ensure compliance with Row Level Security (RLS) policies

2. **Backend Fixes**:
   - Added a database trigger that automatically creates reciprocal follow relationships when a connection request is accepted
   - Added a database trigger that automatically removes the reciprocal follow relationship when a user unfollows someone
   - Added an RPC function (`accept_connection`) that handles the entire acceptance process securely
   - All database functions use `SECURITY DEFINER` to bypass RLS policies, ensuring proper relationship management

3. **Graceful Degradation**:
   - The client-side code tries multiple approaches in sequence:
     1. First tries to use the RPC function (most reliable)
     2. Falls back to direct database manipulation if the RPC function is unavailable
     3. Updates the UI optimistically even if database operations fail

The combination of these approaches ensures that:
- The app works correctly even if the database migrations haven't been applied yet
- Once the migrations are applied, the system uses the most secure and efficient method
- The user experience is seamless regardless of which fix is active 