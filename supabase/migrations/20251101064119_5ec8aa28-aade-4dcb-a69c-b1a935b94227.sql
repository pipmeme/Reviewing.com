-- Create testimonial_photos table for multiple photos per testimonial
CREATE TABLE public.testimonial_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create testimonial_videos table for multiple videos per testimonial
CREATE TABLE public.testimonial_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.testimonial_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photos
CREATE POLICY "Anyone can insert photos"
ON public.testimonial_photos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can view their testimonial photos"
ON public.testimonial_photos
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM testimonials t
  JOIN businesses b ON b.id = t.business_id
  WHERE t.id = testimonial_photos.testimonial_id
  AND b.user_id = auth.uid()
));

CREATE POLICY "Business owners can update their testimonial photos"
ON public.testimonial_photos
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM testimonials t
  JOIN businesses b ON b.id = t.business_id
  WHERE t.id = testimonial_photos.testimonial_id
  AND b.user_id = auth.uid()
));

CREATE POLICY "Business owners can delete their testimonial photos"
ON public.testimonial_photos
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM testimonials t
  JOIN businesses b ON b.id = t.business_id
  WHERE t.id = testimonial_photos.testimonial_id
  AND b.user_id = auth.uid()
));

CREATE POLICY "Public can view approved photos"
ON public.testimonial_photos
FOR SELECT
USING (status = 'approved');

-- RLS Policies for videos
CREATE POLICY "Anyone can insert videos"
ON public.testimonial_videos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can view their testimonial videos"
ON public.testimonial_videos
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM testimonials t
  JOIN businesses b ON b.id = t.business_id
  WHERE t.id = testimonial_videos.testimonial_id
  AND b.user_id = auth.uid()
));

CREATE POLICY "Business owners can update their testimonial videos"
ON public.testimonial_videos
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM testimonials t
  JOIN businesses b ON b.id = t.business_id
  WHERE t.id = testimonial_videos.testimonial_id
  AND b.user_id = auth.uid()
));

CREATE POLICY "Business owners can delete their testimonial videos"
ON public.testimonial_videos
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM testimonials t
  JOIN businesses b ON b.id = t.business_id
  WHERE t.id = testimonial_videos.testimonial_id
  AND b.user_id = auth.uid()
));

CREATE POLICY "Public can view approved videos"
ON public.testimonial_videos
FOR SELECT
USING (status = 'approved');

-- Create testimonial-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-videos', 'testimonial-videos', true);

-- Storage policies for videos
CREATE POLICY "Anyone can upload testimonial videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'testimonial-videos');

CREATE POLICY "Anyone can view testimonial videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'testimonial-videos');

CREATE POLICY "Business owners can delete testimonial videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'testimonial-videos'
  AND auth.role() = 'authenticated'
);