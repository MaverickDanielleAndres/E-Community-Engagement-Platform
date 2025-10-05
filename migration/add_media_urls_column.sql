-- Migration: Add media_urls column to complaints table
-- This column stores an array of media file URLs for complaints

ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}'::text[];
