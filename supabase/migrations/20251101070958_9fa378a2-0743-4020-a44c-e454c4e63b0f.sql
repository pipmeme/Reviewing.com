-- Fix testimonial_photos policy for anonymous uploads
DROP POLICY IF EXISTS "Anyone can insert photos" ON public.testimonial_photos;

CREATE POLICY "Anyone can insert photos"
ON public.testimonial_photos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Fix testimonial_videos policy for anonymous uploads
DROP POLICY IF EXISTS "Anyone can insert videos" ON public.testimonial_videos;

CREATE POLICY "Anyone can insert videos"
ON public.testimonial_videos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);