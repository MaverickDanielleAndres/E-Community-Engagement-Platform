-- Fix Row Level Security policies for users table
-- Allow authenticated users to insert their own records
-- Allow users to read their own records and admins to read all

-- First, enable RLS on the users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all profiles (if we have admin role)
CREATE POLICY "Admins can view all profiles" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Also allow service role to bypass RLS for admin operations
-- This is needed for the API routes that run with service role key
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Enable RLS on community_members table as well
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own community membership" ON community_members;
DROP POLICY IF EXISTS "Users can insert their own community membership" ON community_members;
DROP POLICY IF EXISTS "Admins can manage community members" ON community_members;

-- Policy: Users can view their own community membership
CREATE POLICY "Users can view their own community membership" ON community_members
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own community membership
CREATE POLICY "Users can insert their own community membership" ON community_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can manage community members
CREATE POLICY "Admins can manage community members" ON community_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Enable RLS on communities table
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view communities they belong to" ON communities;
DROP POLICY IF EXISTS "Admins can manage communities" ON communities;

-- Policy: Users can view communities they belong to
CREATE POLICY "Users can view communities they belong to" ON communities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members
            WHERE community_members.community_id = communities.id
            AND community_members.user_id = auth.uid()
        )
    );

-- Policy: Admins can manage communities
CREATE POLICY "Admins can manage communities" ON communities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
