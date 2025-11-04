-- Add admin_response field to feedback table
ALTER TABLE public.feedback
ADD COLUMN admin_response text,
ADD COLUMN admin_response_at timestamp with time zone,
ADD COLUMN admin_response_by uuid REFERENCES public.users(id);

-- Add index for performance
CREATE INDEX idx_feedback_admin_response_at ON public.feedback(admin_response_at);

-- Add comment
COMMENT ON COLUMN public.feedback.admin_response IS 'Admin response to user feedback';
COMMENT ON COLUMN public.feedback.admin_response_at IS 'Timestamp when admin responded';
COMMENT ON COLUMN public.feedback.admin_response_by IS 'User ID of admin who responded';
