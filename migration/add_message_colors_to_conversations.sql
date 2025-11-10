-- Add message color columns to conversations table
ALTER TABLE conversations ADD COLUMN admin_message_color TEXT DEFAULT '#f59e0b';
ALTER TABLE conversations ADD COLUMN member_message_color TEXT DEFAULT '#10b981';
ALTER TABLE conversations ADD COLUMN self_message_color TEXT DEFAULT '#3b82f6';
