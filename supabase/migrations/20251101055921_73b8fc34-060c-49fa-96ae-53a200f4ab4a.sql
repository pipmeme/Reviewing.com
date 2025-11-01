-- Create profiles table for business owners
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#14b8a6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view their own business"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view businesses for testimonial submission"
  ON public.businesses FOR SELECT
  USING (true);

-- Testimonials policies
CREATE POLICY "Business owners can view their testimonials"
  ON public.testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = testimonials.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit testimonials"
  ON public.testimonials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners can update their testimonials"
  ON public.testimonials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = testimonials.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their testimonials"
  ON public.testimonials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = testimonials.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view approved testimonials"
  ON public.testimonials FOR SELECT
  USING (status = 'approved');

-- Create storage bucket for testimonial photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-photos', 'testimonial-photos', true);

-- Storage policies
CREATE POLICY "Anyone can upload testimonial photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'testimonial-photos');

CREATE POLICY "Public can view testimonial photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonial-photos');

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();