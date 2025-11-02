-- Row Level Security policies for messaging tables

-- Enable RLS on all messaging tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations in their community" ON conversations
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT cm.community_id FROM community_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations they participate in" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

-- Conversation participants policies
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to conversations they participate in" ON conversation_participants
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
    AND user_id IN (
      SELECT cm.user_id FROM community_members cm
      WHERE cm.community_id = (
        SELECT c.community_id FROM conversations c
        WHERE c.id = conversation_participants.conversation_id
      )
    )
    AND user_id NOT IN (
      SELECT u.id FROM users u WHERE u.role = 'Admin'
    )
  );

CREATE POLICY "Users can update their own participant records" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to conversations they participate in" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- Message attachments policies
CREATE POLICY "Users can view attachments in their conversations" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for their messages" ON message_attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT m.id FROM messages m WHERE m.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from their messages" ON message_attachments
  FOR DELETE USING (
    message_id IN (
      SELECT m.id FROM messages m WHERE m.sender_id = auth.uid()
    )
  );

-- Message reactions policies
CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations" ON message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Message reads policies
CREATE POLICY "Users can view read receipts in their conversations" ON message_reads
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read in their conversations" ON message_reads
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own read receipts" ON message_reads
  FOR UPDATE USING (user_id = auth.uid());

-- Audit logs policies (read-only for users, full access for service role)
CREATE POLICY "Users can view audit logs for their actions" ON audit_logs
  FOR SELECT USING (actor_id = auth.uid());

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when messages are inserted
CREATE TRIGGER trigger_update_conversation_last_message_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message_at();

-- Function to clean up empty conversations (optional)
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS TRIGGER AS $$
BEGIN
  -- If this was the last participant, we could delete the conversation
  -- But for now, we'll just leave it for potential future use
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
