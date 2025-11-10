-- Migration to ensure only one default group chat per community
-- This prevents duplicate Group Chat conversations

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_default_group_chat_per_community
ON conversations (community_id)
WHERE is_group = true AND is_default = true;
