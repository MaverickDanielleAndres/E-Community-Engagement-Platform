-- Add 'admin' to member_role enum if not exists
-- Run this in Supabase SQL Editor before other migrations

DO $$
BEGIN
  -- Check if 'admin' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumtypid = 'public.member_role'::regtype 
    AND enumlabel = 'admin'
  ) THEN
    -- Add 'admin' to the enum
    ALTER TYPE public.member_role ADD VALUE 'admin';
  END IF;
END $$;

-- Also add 'moderator' if needed for future use
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumtypid = 'public.member_role'::regtype 
    AND enumlabel = 'moderator'
  ) THEN
    ALTER TYPE public.member_role ADD VALUE 'moderator';
  END IF;
END $$;

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'public.member_role'::regtype 
ORDER BY enumsortorder;
