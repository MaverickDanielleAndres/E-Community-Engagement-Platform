-- Migration: Add image_url column to announcements table
-- This column stores the URL of the announcement image

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS image_url text;
