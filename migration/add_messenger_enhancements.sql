-- Add messenger enhancements for full messenger functionality

-- Add message_type to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'voice', 'gif'));

-- Add pinned_messages table
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  message_id uuid NOT NULL,
  pinned_by uuid NOT NULL,
  pinned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pinned_messages_pkey PRIMARY KEY (id),
  CONSTRAINT pinned_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT pinned_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT pinned_messages_pinned_by_fkey FOREIGN KEY (pinned_by) REFERENCES public.users(id)
);

-- Add message_status table for read receipts
CREATE TABLE IF NOT EXISTS public.message_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered', 'read')),
  status_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_status_pkey PRIMARY KEY (id),
  CONSTRAINT message_status_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT message_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT message_status_unique UNIQUE (message_id, user_id)
);

-- Add conversation_settings table
CREATE TABLE IF NOT EXISTS public.conversation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  custom_title text,
  is_muted boolean NOT NULL DEFAULT false,
  mute_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversation_settings_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_settings_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT conversation_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT conversation_settings_unique UNIQUE (conversation_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation ON public.pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_status_message ON public.message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user ON public.message_status(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_settings_conversation ON public.conversation_settings(conversation_id);

-- Add search index for users (for contact search)
CREATE INDEX IF NOT EXISTS idx_users_name_search ON public.users USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_users_email_search ON public.users USING gin(to_tsvector('english', email));

-- Enable RLS on new tables
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pinned_messages
CREATE POLICY "Users can view pinned messages in their conversations" ON public.pinned_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = pinned_messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can pin messages in their conversations" ON public.pinned_messages
  FOR INSERT WITH CHECK (
    pinned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = pinned_messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unpin their own pins" ON public.pinned_messages
  FOR DELETE USING (pinned_by = auth.uid());

-- RLS Policies for message_status
CREATE POLICY "Users can view status of messages in their conversations" ON public.message_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_status.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update status of messages in their conversations" ON public.message_status
  FOR ALL USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_status.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- RLS Policies for conversation_settings
CREATE POLICY "Users can view their own conversation settings" ON public.conversation_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own conversation settings" ON public.conversation_settings
  FOR ALL USING (user_id = auth.uid());
