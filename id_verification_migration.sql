-- Migration to add ID verification system columns

-- Add status column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing users to approved status
UPDATE public.users
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

-- Add missing columns to id_verifications table
ALTER TABLE public.id_verifications
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.id_verifications
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

ALTER TABLE public.id_verifications
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.users(id);

ALTER TABLE public.id_verifications
ADD COLUMN IF NOT EXISTS rejection_reason text;
