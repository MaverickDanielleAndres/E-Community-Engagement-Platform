-- Add admin role to user
-- Replace 'admin@example.com' with the actual user email if different

-- First, get the user id
-- Then, ensure they are in community_members with role 'Admin'

-- Assuming there's a community with id 1 (adjust if needed)
INSERT INTO community_members (user_id, community_id, role, created_at)
SELECT u.id, 1, 'Admin', NOW()
FROM users u
WHERE u.email = 'maverickdanielle@gmail.com'
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'Admin';

-- If the community doesn't exist, create one
INSERT INTO communities (name, code, created_at)
VALUES ('Default Community', 'DEFAULT', NOW())
ON CONFLICT (code) DO NOTHING;
