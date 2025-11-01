-- Create campaigns table to track email campaigns
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_sent INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0
);

-- Create campaign_recipients table to track individual email sends
CREATE TABLE public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  unique_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Business owners can view their campaigns"
ON public.campaigns
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = campaigns.business_id
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Business owners can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = campaigns.business_id
  AND businesses.user_id = auth.uid()
));

-- RLS Policies for campaign_recipients
CREATE POLICY "Business owners can view their campaign recipients"
ON public.campaign_recipients
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM campaigns
  JOIN businesses ON businesses.id = campaigns.business_id
  WHERE campaigns.id = campaign_recipients.campaign_id
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Business owners can insert campaign recipients"
ON public.campaign_recipients
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM campaigns
  JOIN businesses ON businesses.id = campaigns.business_id
  WHERE campaigns.id = campaign_recipients.campaign_id
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Business owners can update their campaign recipients"
ON public.campaign_recipients
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM campaigns
  JOIN businesses ON businesses.id = campaigns.business_id
  WHERE campaigns.id = campaign_recipients.campaign_id
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Public can view recipient by token"
ON public.campaign_recipients
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_campaign_recipients_token ON public.campaign_recipients(unique_token);
CREATE INDEX idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_campaigns_business_id ON public.campaigns(business_id);