-- Fix users status constraint to include 'unverified'
-- This allows new users to be created with status 'unverified' during email verification

-- Drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE users ADD CONSTRAINT users_status_check
CHECK (status IN ('unverified', 'pending', 'approved', 'rejected'));

-- Update any existing users with NULL status to 'unverified' (if any)
UPDATE users SET status = 'unverified' WHERE status IS NULL;
