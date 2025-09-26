-- Migration for Dynamic Feedback Form Support
-- Run this in Supabase SQL Editor

-- 1. Add form_data column to feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- 2. Create feedback_form_configs table
CREATE TABLE IF NOT EXISTS feedback_form_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id)
);

-- 3. Enable RLS on feedback_form_configs
ALTER TABLE feedback_form_configs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for feedback_form_configs
-- Allow admins to read/write configs for their community
CREATE POLICY "feedback_form_configs_admin_access" ON feedback_form_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = feedback_form_configs.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- 5. Update feedback table RLS to allow form_data access
-- (Assuming existing policies, add form_data to select if needed)
-- The existing policies should work as form_data is just another column

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_feedback_form_configs_community_id
  ON feedback_form_configs(community_id);

CREATE INDEX IF NOT EXISTS idx_feedback_form_data
  ON feedback(form_data) WHERE form_data IS NOT NULL;

-- 7. Insert default config for existing communities (optional)
-- This will be handled by the API if no config exists
-- INSERT INTO feedback_form_configs (community_id, config)
-- SELECT
--   c.id as community_id,
--   '[
--     {"id": "name", "type": "text", "label": "Name", "required": true},
--     {"id": "address", "type": "text", "label": "Address", "required": true},
--     {"id": "satisfaction", "type": "radio", "label": "Nasiyahan po ba kayo sa aming paglilingkod?", "required": true, "options": ["😊 Excellent", "🙂 Very Good", "😐 Good", "😕 Poor", "😞 Very Poor"]},
--     {"id": "comments", "type": "textarea", "label": "Comments/Suggestions/Feedback", "required": false}
--   ]'::jsonb as config
-- FROM communities c
-- WHERE NOT EXISTS (
--   SELECT 1 FROM feedback_form_configs ffc WHERE ffc.community_id = c.id
-- );
