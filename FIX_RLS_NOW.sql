-- EMERGENCY RLS FIX - Run this in Supabase SQL Editor NOW
-- Go to: https://supabase.com/dashboard/project/qrxkafcseodkveivyqdg/sql/new

-- Step 1: Disable RLS completely
ALTER TABLE IF EXISTS public.testimonials DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Allow public testimonial submission" ON public.testimonials;
DROP POLICY IF EXISTS "Anyone can submit testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Business owners can view their testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Business owners can manage their testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Business owners can update their testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Business owners can delete their testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "anon_can_insert_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "authenticated_can_insert_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "business_owners_can_select_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "business_owners_can_update_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "business_owners_can_delete_testimonials" ON public.testimonials;

-- Step 3: Grant permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT ON public.testimonials TO anon;
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.campaigns TO anon;

-- Step 4: Re-enable RLS (required for policies to work)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONE simple permissive INSERT policy for anonymous users
CREATE POLICY "allow_anonymous_insert"
ON public.testimonials
FOR INSERT
TO anon
WITH CHECK (true);

-- Step 6: Create ONE simple permissive INSERT policy for authenticated users
CREATE POLICY "allow_authenticated_insert"
ON public.testimonials
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 7: Allow business owners to view their testimonials
CREATE POLICY "owners_view_testimonials"
ON public.testimonials
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE user_id = auth.uid()
  )
);

-- Step 8: Allow business owners to update their testimonials
CREATE POLICY "owners_update_testimonials"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE user_id = auth.uid()
  )
);

-- Step 9: Allow business owners to delete their testimonials
CREATE POLICY "owners_delete_testimonials"
ON public.testimonials
FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE user_id = auth.uid()
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'testimonials'
ORDER BY policyname;
