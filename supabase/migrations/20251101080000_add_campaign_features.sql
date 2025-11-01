-- Extend campaigns table to support custom testimonial/feedback forms
ALTER TABLE public.campaigns
ADD COLUMN description TEXT,
ADD COLUMN custom_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN allow_video BOOLEAN DEFAULT true,
ADD COLUMN allow_photo BOOLEAN DEFAULT true,
ADD COLUMN allow_text BOOLEAN DEFAULT true,
ADD COLUMN allow_rating BOOLEAN DEFAULT true,
ADD COLUMN unique_slug TEXT UNIQUE,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add campaign_id to testimonials to link them to campaigns
ALTER TABLE public.testimonials
ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_testimonials_campaign_id ON public.testimonials(campaign_id);
CREATE INDEX idx_campaigns_slug ON public.campaigns(unique_slug);

-- Function to generate unique slug from campaign name
CREATE OR REPLACE FUNCTION public.generate_campaign_slug(campaign_name TEXT, business_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(campaign_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'campaign';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM campaigns WHERE unique_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to auto-generate slug on campaign insert if not provided
CREATE OR REPLACE FUNCTION public.set_campaign_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.unique_slug IS NULL OR NEW.unique_slug = '' THEN
    NEW.unique_slug := generate_campaign_slug(NEW.name, NEW.business_id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate slug
CREATE TRIGGER trigger_set_campaign_slug
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_campaign_slug();

-- Update RLS policies to allow public access to campaigns by slug (for submit form)
CREATE POLICY "Public can view campaigns by slug"
ON public.campaigns
FOR SELECT
USING (unique_slug IS NOT NULL);

-- Allow business owners to update campaigns
CREATE POLICY "Business owners can update their campaigns"
ON public.campaigns
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = campaigns.business_id
  AND businesses.user_id = auth.uid()
));

-- Allow business owners to delete campaigns
CREATE POLICY "Business owners can delete their campaigns"
ON public.campaigns
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = campaigns.business_id
  AND businesses.user_id = auth.uid()
));
