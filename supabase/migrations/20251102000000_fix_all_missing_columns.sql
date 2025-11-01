-- Fix all missing columns for testimonials app to work properly
-- Run this migration in your Supabase SQL Editor

-- Add missing columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_logo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#38B2AC';

-- Add missing columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allow_photo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_video BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Add missing columns to testimonials table
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_testimonials_campaign_id ON testimonials(campaign_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_business_id ON testimonials(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON campaigns(business_id);

-- Update RLS policies to allow form submissions
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public testimonial submission" ON testimonials;
DROP POLICY IF EXISTS "Business owners can view their testimonials" ON testimonials;

-- Allow anyone to insert testimonials (public form submission)
CREATE POLICY "Allow public testimonial submission"
ON testimonials FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow business owners to view their testimonials
CREATE POLICY "Business owners can view their testimonials"
ON testimonials FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Allow business owners to update/delete their testimonials
CREATE POLICY "Business owners can manage their testimonials"
ON testimonials FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete their testimonials"
ON testimonials FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Update campaigns table RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to view active campaigns" ON campaigns;
DROP POLICY IF EXISTS "Business owners can manage campaigns" ON campaigns;

-- Allow public to view campaigns (needed for submission form)
CREATE POLICY "Allow public to view active campaigns"
ON campaigns FOR SELECT
TO anon, authenticated
USING (true);

-- Allow business owners to manage their campaigns
CREATE POLICY "Business owners can manage campaigns"
ON campaigns FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Update businesses table RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to view businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can manage their business" ON businesses;

-- Allow public to view businesses (needed for submission form branding)
CREATE POLICY "Allow public to view businesses"
ON businesses FOR SELECT
TO anon, authenticated
USING (true);

-- Allow business owners to manage their business
CREATE POLICY "Business owners can manage their business"
ON businesses FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Add helpful comments
COMMENT ON COLUMN businesses.custom_colors IS 'JSON object with primary and secondary brand colors';
COMMENT ON COLUMN businesses.custom_logo_url IS 'URL for custom uploaded logo';
COMMENT ON COLUMN campaigns.custom_questions IS 'Array of custom question objects for the campaign';
COMMENT ON COLUMN testimonials.custom_answers IS 'JSON object with answers to custom questions';
COMMENT ON COLUMN testimonials.photo_urls IS 'Array of photo URLs uploaded with testimonial';
COMMENT ON COLUMN testimonials.video_urls IS 'Array of video URLs uploaded with testimonial';
