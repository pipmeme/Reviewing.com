-- Add email notification settings to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS notify_new_testimonial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true;

-- Add branding customization columns
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT '{"primary": "#4FD1C5", "secondary": "#38B2AC"}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_fonts JSONB DEFAULT '{"heading": "Inter", "body": "Inter"}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_logo_url TEXT,
ADD COLUMN IF NOT EXISTS show_branding BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_css TEXT;

-- Create analytics events table for advanced tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_business_date 
ON public.analytics_events(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
ON public.analytics_events(event_type);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy for business owners to view their analytics
CREATE POLICY "Business owners can view their analytics"
ON public.analytics_events
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = analytics_events.business_id
  AND businesses.user_id = auth.uid()
));

-- Policy for business owners to insert analytics
CREATE POLICY "Business owners can insert their analytics"
ON public.analytics_events
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = analytics_events.business_id
  AND businesses.user_id = auth.uid()
));

-- Function to track testimonial views
CREATE OR REPLACE FUNCTION public.track_testimonial_view(
  p_business_id UUID,
  p_testimonial_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO analytics_events (business_id, event_type, event_data)
  VALUES (
    p_business_id,
    'testimonial_view',
    jsonb_build_object('testimonial_id', p_testimonial_id)
  );
END;
$$;

-- Function to track form submissions
CREATE OR REPLACE FUNCTION public.track_form_submission(
  p_business_id UUID,
  p_campaign_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO analytics_events (business_id, event_type, event_data)
  VALUES (
    p_business_id,
    'form_submission',
    jsonb_build_object('campaign_id', p_campaign_id)
  );
END;
$$;
