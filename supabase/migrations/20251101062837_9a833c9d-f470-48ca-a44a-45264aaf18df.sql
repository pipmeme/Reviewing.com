-- Ensure testimonial-photos bucket allows public read access
CREATE POLICY "Anyone can view testimonial photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'testimonial-photos');

-- Allow authenticated users (business owners) to download photos
CREATE POLICY "Business owners can download testimonial photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'testimonial-photos' 
  AND auth.role() = 'authenticated'
);