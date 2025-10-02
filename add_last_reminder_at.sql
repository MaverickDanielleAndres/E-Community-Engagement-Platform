-- Migration to add last_reminder_at column to users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_reminder_at timestamp with time zone;
