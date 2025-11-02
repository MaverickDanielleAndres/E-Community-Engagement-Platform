-- Add missing foreign key constraints to messaging tables

BEGIN;

-- Add foreign key constraints to messages table
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraints to conversation_participants table
ALTER TABLE conversation_participants
ADD CONSTRAINT conversation_participants_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraints to message_reactions table
ALTER TABLE message_reactions
ADD CONSTRAINT message_reactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraints to message_reads table
ALTER TABLE message_reads
ADD CONSTRAINT message_reads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraints to conversations table
ALTER TABLE conversations
ADD CONSTRAINT conversations_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

COMMIT;
