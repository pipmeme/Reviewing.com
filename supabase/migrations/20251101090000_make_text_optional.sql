-- Make testimonial text field optional
ALTER TABLE public.testimonials 
ALTER COLUMN text DROP NOT NULL;

-- Set default to empty string for backwards compatibility
ALTER TABLE public.testimonials 
ALTER COLUMN text SET DEFAULT '';
