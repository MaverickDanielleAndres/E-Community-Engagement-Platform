-- Add role column to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='role'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN role text DEFAULT 'Guest';
    END IF;
END$$;

-- Create an index on role for faster queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename='users' AND indexname='idx_users_role'
    ) THEN
        CREATE INDEX idx_users_role ON public.users(role);
    END IF;
END$$;

-- Update existing users with role 'Guest' if null
UPDATE public.users
SET role = 'Guest'
WHERE role IS NULL;

-- Add foreign key constraint to community_members.user_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'community_members'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id'
    ) THEN
        ALTER TABLE public.community_members
        ADD CONSTRAINT fk_community_members_user FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END$$;

-- Create index on community_members.user_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename='community_members' AND indexname='idx_community_members_user_id'
    ) THEN
        CREATE INDEX idx_community_members_user_id ON public.community_members(user_id);
    END IF;
END$$;

-- Create or replace view to get user roles combining users and community_members
CREATE OR REPLACE VIEW public.user_roles AS
SELECT u.id as user_id,
       COALESCE(cm.role, u.role) as role
FROM public.users u
LEFT JOIN public.community_members cm ON u.id = cm.user_id;

-- Grant select on view to authenticated role
GRANT SELECT ON public.user_roles TO authenticated;
