-- ========================================
-- COMPLETE DATABASE SETUP - NO ERRORS
-- Project: askbzwvetijmxututwfh
-- ========================================

-- STEP 1: Drop everything if exists (clean slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_set_campaign_slug ON public.campaigns;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS generate_campaign_slug();
DROP TABLE IF EXISTS public.campaign_recipients CASCADE;
DROP TABLE IF EXISTS public.testimonial_videos CASCADE;
DROP TABLE IF EXISTS public.testimonial_photos CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- STEP 2: Create all tables
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#14b8a6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_sent INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0
);

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

CREATE TABLE public.testimonial_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.testimonial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  unique_token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create indexes
CREATE INDEX idx_testimonials_business_id ON public.testimonials(business_id);
CREATE INDEX idx_testimonials_campaign_id ON public.testimonials(campaign_id);
CREATE INDEX idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX idx_campaigns_unique_slug ON public.campaigns(unique_slug);

-- STEP 4: Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonial-photos', 'testimonial-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- STEP 5: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 7: Create RLS policies for businesses
CREATE POLICY "businesses_select_all" ON public.businesses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "businesses_manage_own" ON public.businesses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- STEP 8: Create RLS policies for campaigns
CREATE POLICY "campaigns_select_all" ON public.campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "campaigns_manage_own" ON public.campaigns FOR ALL TO authenticated USING (business_id IN (SELECT b.id FROM public.businesses b WHERE b.user_id = auth.uid())) WITH CHECK (business_id IN (SELECT b.id FROM public.businesses b WHERE b.user_id = auth.uid()));

-- STEP 9: Create RLS policies for testimonials (PERMISSIVE)
CREATE POLICY "testimonials_insert_anon" ON public.testimonials FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "testimonials_insert_auth" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "testimonials_select_own" ON public.testimonials FOR SELECT TO authenticated USING (business_id IN (SELECT b.id FROM public.businesses b WHERE b.user_id = auth.uid()));
CREATE POLICY "testimonials_update_own" ON public.testimonials FOR UPDATE TO authenticated USING (business_id IN (SELECT b.id FROM public.businesses b WHERE b.user_id = auth.uid()));
CREATE POLICY "testimonials_delete_own" ON public.testimonials FOR DELETE TO authenticated USING (business_id IN (SELECT b.id FROM public.businesses b WHERE b.user_id = auth.uid()));

-- STEP 10: Create RLS policies for testimonial_photos
CREATE POLICY "photos_insert_all" ON public.testimonial_photos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "photos_select_own" ON public.testimonial_photos FOR SELECT TO authenticated USING (testimonial_id IN (SELECT t.id FROM public.testimonials t JOIN public.businesses b ON t.business_id = b.id WHERE b.user_id = auth.uid()));

-- STEP 11: Create RLS policies for testimonial_videos
CREATE POLICY "videos_insert_all" ON public.testimonial_videos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "videos_select_own" ON public.testimonial_videos FOR SELECT TO authenticated USING (testimonial_id IN (SELECT t.id FROM public.testimonials t JOIN public.businesses b ON t.business_id = b.id WHERE b.user_id = auth.uid()));

-- STEP 12: Create storage policies
CREATE POLICY "storage_photos_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'testimonial-photos');
CREATE POLICY "storage_photos_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'testimonial-photos');
CREATE POLICY "storage_videos_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'testimonial-videos');
CREATE POLICY "storage_videos_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'testimonial-videos');
CREATE POLICY "storage_logos_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'business-logos');
CREATE POLICY "storage_logos_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'business-logos');

-- STEP 13: Grant permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT, INSERT ON public.testimonials TO anon;
GRANT INSERT ON public.testimonial_photos TO anon;
GRANT INSERT ON public.testimonial_videos TO anon;

-- STEP 14: Create function to auto-generate campaign slugs
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

-- STEP 15: Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- SETUP COMPLETE!
-- ========================================
