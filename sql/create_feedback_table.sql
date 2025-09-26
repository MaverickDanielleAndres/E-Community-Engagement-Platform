-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  template_id uuid,
  rating integer,
  comment text,
  form_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT feedback_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.feedback_form_templates(id)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "feedback_select_policy" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = feedback.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_insert_policy" ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = feedback.community_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_community_id ON public.feedback(community_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_form_data ON public.feedback(form_data) WHERE form_data IS NOT NULL;
