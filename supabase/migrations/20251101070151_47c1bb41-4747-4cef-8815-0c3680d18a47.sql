-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can submit testimonials" ON public.testimonials;

-- Recreate the policy to allow anonymous testimonial submissions
CREATE POLICY "Anyone can submit testimonials"
ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (true);