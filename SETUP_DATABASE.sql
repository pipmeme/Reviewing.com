-- COMPLETE DATABASE SETUP FOR FRESH SUPABASE PROJECT
-- Copy ALL of this and run it in: https://askbzwvetijmxututwfh.supabase.co/project/askbzwvetijmxututwfh/sql/new

-- =====================================================
-- STEP 1: CREATE ALL TABLES
-- =====================================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#14b8a6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unique_slug TEXT UNIQUE,
  custom_questions JSONB DEFAULT NULL,
  allow_photo BOOLEAN DEFAULT true,
  allow_video BOOLEAN DEFAULT true,
  allow_text BOOLEAN DEFAULT true,
  description TEXT DEFAULT NULL,
  welcome_video_url TEXT DEFAULT NULL,
  video_autoplay BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_sent INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0
);

-- Testimonials table
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  custom_answers JSONB DEFAULT NULL,
  photo_urls TEXT[] DEFAULT NULL,
  video_urls TEXT[] DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonial photos table
CREATE TABLE public.testimonial_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonial videos table
CREATE TABLE public.testimonial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign recipients table
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

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX idx_testimonials_business_id ON public.testimonials(business_id);
CREATE INDEX idx_testimonials_campaign_id ON public.testimonials(campaign_id);
CREATE INDEX idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX idx_campaigns_unique_slug ON public.campaigns(unique_slug);

-- =====================================================
-- STEP 3: CREATE STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonial-photos', 'testimonial-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Anyone can view businesses"
  ON public.businesses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners can manage their business"
  ON public.businesses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Campaigns policies
CREATE POLICY "Anyone can view campaigns"
  ON public.campaigns FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners can manage campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Testimonials policies (PERMISSIVE for public submission)
CREATE POLICY "Anonymous can insert testimonials"
  ON public.testimonials FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Testimonial photos policies
CREATE POLICY "Anyone can insert photos"
  ON public.testimonial_photos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view photos"
  ON public.testimonial_photos FOR SELECT
  TO authenticated
  USING (
    testimonial_id IN (
      SELECT id FROM public.testimonials t
      JOIN public.businesses b ON t.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Testimonial videos policies
CREATE POLICY "Anyone can insert videos"
  ON public.testimonial_videos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view videos"
  ON public.testimonial_videos FOR SELECT
  TO authenticated
  USING (
    testimonial_id IN (
      SELECT id FROM public.testimonials t
      JOIN public.businesses b ON t.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 6: STORAGE POLICIES
-- =====================================================

CREATE POLICY "Anyone can upload photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'testimonial-photos');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'testimonial-photos');

CREATE POLICY "Anyone can upload videos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'testimonial-videos');

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'testimonial-videos');

CREATE POLICY "Anyone can upload logos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'business-logos');

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'business-logos');

-- =====================================================
-- STEP 7: GRANT PERMISSIONS TO ANON ROLE
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT, INSERT ON public.testimonials TO anon;
GRANT INSERT ON public.testimonial_photos TO anon;
GRANT INSERT ON public.testimonial_videos TO anon;

-- =====================================================
-- STEP 8: CREATE TRIGGER FOR CAMPAIGN SLUGS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_campaign_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_slug IS NULL THEN
    NEW.unique_slug := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_campaign_slug
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION generate_campaign_slug();

-- =====================================================
-- DONE! Database is ready!
-- =====================================================
