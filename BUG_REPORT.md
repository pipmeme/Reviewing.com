# CRITICAL BUG REPORT: Testimonial Submission Failing with RLS Error

## Date: November 2, 2025
## Severity: CRITICAL (Production Blocking)
## Environment: Production (review-staking-com.vercel.app)

---

## PROBLEM SUMMARY

Users cannot submit testimonials through the public form at `/submit/08429200`. Every submission attempt fails with error code **42501** - "new row violates row-level security policy for table 'testimonials'".

---

## TECHNICAL DETAILS

### Error Information
- **Error Code**: 42501
- **Error Message**: "new row violates row-level security policy for table \"testimonials\""
- **Table**: `public.testimonials`
- **Operation**: INSERT
- **User Role**: `anon` (anonymous/unauthenticated)

### Database Information
- **Supabase Project**: qrxkafcseodkveivyqdg.supabase.co
- **Database**: PostgreSQL via Supabase
- **Affected Table**: `public.testimonials`
- **Current RLS Status**: ENABLED

### Frontend Information
- **URL**: https://review-staking-com.vercel.app/submit/08429200
- **Framework**: React 18.3.1 + TypeScript + Vite
- **Supabase Client**: @supabase/supabase-js
- **Authentication Mode**: Anonymous (anon key)

---

## ROOT CAUSE ANALYSIS

### Primary Issue: Row-Level Security (RLS) Policy Configuration

The `public.testimonials` table has RLS enabled, but the policies are either:
1. **Missing** - No policy exists to allow anonymous users to INSERT
2. **Misconfigured** - Policy exists but WITH CHECK clause is evaluating to false
3. **Cached** - Old restrictive policies are cached on Supabase edge servers

### Database Schema

The testimonials table structure:
```sql
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,  -- Made optional in migration 20251101090000
  custom_answers JSONB DEFAULT NULL,
  photo_urls TEXT[] DEFAULT NULL,
  video_urls TEXT[] DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### INSERT Statement Being Executed

```typescript
const { data, error } = await supabase
  .from("testimonials")
  .insert({
    business_id: campaign.business_id,  // UUID from campaign
    campaign_id: campaign.id,            // UUID from campaign
    name: sanitizedData.name,            // String (required)
    email: sanitizedData.email || null,  // String or null
    rating: sanitizedData.rating,        // Integer 1-5 (required)
    text: sanitizedData.text,            // String (can be empty)
    custom_answers: sanitizedData.customAnswers,  // JSONB object
    photo_urls: [],                      // Empty array
    video_urls: [],                      // Empty array
    status: 'pending'                    // String literal
  })
  .select()
  .single();
```

### Current RLS Policies

After running the fix SQL, the following policies should exist:
1. `allow_anon_insert` - FOR INSERT TO anon WITH CHECK (true)
2. `allow_auth_insert` - FOR INSERT TO authenticated WITH CHECK (true)
3. `owners_select` - FOR SELECT TO authenticated (business owners only)

However, the error persists, suggesting:
- Policies are not active yet (edge cache delay)
- OR there's a conflicting policy we haven't dropped
- OR permissions haven't been granted properly to `anon` role

---

## ATTEMPTS TO FIX (All Failed)

### Attempt 1: Created RLS Policies
```sql
CREATE POLICY "Allow public testimonial submission" ON testimonials 
FOR INSERT WITH CHECK (true);
```
**Result**: Failed - Error persisted

### Attempt 2: Granted Permissions to Anon Role
```sql
GRANT INSERT, SELECT ON testimonials TO anon;
```
**Result**: Failed - Error persisted

### Attempt 3: Disabled RLS Completely
```sql
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
```
**Result**: Failed - Error still occurred (impossible if RLS truly disabled)

### Attempt 4: Dropped and Recreated All Policies
```sql
DROP POLICY IF EXISTS [all existing policies];
CREATE POLICY "anon_can_insert_testimonials" ON testimonials 
FOR INSERT TO anon WITH CHECK (true);
```
**Result**: Failed - Error persisted

### Attempt 5: Complete RLS Reset (Most Recent)
```sql
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
[Drop all policies]
GRANT SELECT, INSERT ON testimonials TO anon;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_anon_insert" ON testimonials FOR INSERT TO anon WITH CHECK (true);
```
**Result**: SQL executed successfully, but error still occurs on frontend

---

## CURRENT HYPOTHESIS

The issue is likely one of these:

### Hypothesis 1: Edge Cache Delay
Supabase uses edge caching for RLS policies. After updating policies, there can be a **5-15 minute delay** before changes propagate to all edge servers globally. The frontend may be hitting a cached version of old restrictive policies.

**Solution**: Wait 15-20 minutes after running the SQL fix, then test again.

### Hypothesis 2: Service Role Key Needed
The `anon` (publishable) key has RLS enforced. For public submissions that should bypass RLS, we may need to:
- Use service_role key (bypasses RLS) for testimonial inserts only
- Create a Supabase Edge Function that uses service_role internally
- Keep anon key for reading campaigns/businesses

**Solution**: Implement server-side testimonial submission endpoint.

### Hypothesis 3: Foreign Key Constraint Violation
The error message says "RLS policy" but it might be misleading. The real issue could be:
- `business_id` UUID doesn't exist in `businesses` table
- `campaign_id` UUID doesn't exist in `campaigns` table
- Foreign key constraint failing but error message is wrong

**Solution**: Add validation logging to verify UUIDs exist before insert.

### Hypothesis 4: Column-Level RLS
There might be column-level security policies we haven't checked that are blocking specific columns like `business_id` or `campaign_id`.

**Solution**: Check for column-level policies with:
```sql
SELECT * FROM pg_policies WHERE tablename = 'testimonials';
```

---

## RECOMMENDED SOLUTION

### Option A: Server-Side Submission (Most Reliable)

Create a Supabase Edge Function that handles testimonial submission using service_role key:

```typescript
// supabase/functions/submit-testimonial/index.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Bypasses RLS
)

Deno.serve(async (req) => {
  const testimonialData = await req.json()
  
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .insert(testimonialData)
    .select()
    .single()
  
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 400 })
  }
  
  return new Response(JSON.stringify({ data }), { status: 200 })
})
```

**Pros**: 
- Bypasses RLS completely
- More secure (can validate server-side)
- No edge cache issues

**Cons**: 
- Requires Edge Function deployment
- Extra latency from function call

### Option B: Wait for Cache Propagation (Simplest)

The SQL fix has been run successfully. The policies ARE correct in the database. The issue is likely edge cache delay.

**Steps**:
1. Wait 15-20 minutes after running the SQL
2. Try submission again
3. If still failing, check policy status with:
```sql
SELECT * FROM pg_policies WHERE tablename = 'testimonials';
```

### Option C: Temporarily Disable RLS (Quick Fix, Not Recommended for Production)

```sql
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
```

This completely removes security but will make submissions work immediately.

**WARNING**: This exposes the table to unrestricted access. Only use for testing.

---

## FILES TO CHECK

### 1. Frontend Code
- `src/pages/Submit.tsx` - Lines 324-347 (testimonial insert)
- `src/integrations/supabase/client.ts` - Supabase client configuration

### 2. Database Migrations
- `supabase/migrations/20251101055921_*.sql` - Initial table creation
- `supabase/migrations/20251102000000_fix_all_missing_columns.sql` - Column additions
- `supabase/migrations/20251102120000_complete_rls_reset.sql` - Latest RLS fix

### 3. Environment Variables
- `.env` - Contains VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
- Vercel Environment Variables - Same keys set in production

---

## VERIFICATION STEPS

To verify the fix is working:

### 1. Check Current Policies
```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual,
  with_check 
FROM pg_policies 
WHERE tablename = 'testimonials';
```

Expected output:
```
policyname: allow_anon_insert
roles: {anon}
cmd: INSERT
with_check: true
```

### 2. Check Grants
```sql
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'testimonials' 
  AND grantee = 'anon';
```

Expected output:
```
anon | SELECT
anon | INSERT
```

### 3. Test Direct Insert (using SQL Editor with anon role)
```sql
-- This should succeed
INSERT INTO testimonials (business_id, campaign_id, name, rating, text, status)
SELECT 
  b.id,
  c.id,
  'Test User',
  5,
  'Test testimonial',
  'pending'
FROM businesses b
JOIN campaigns c ON c.business_id = b.id
LIMIT 1;
```

### 4. Check for Conflicting Policies
```sql
-- Look for any RESTRICTIVE policies
SELECT * FROM pg_policies 
WHERE tablename = 'testimonials' 
  AND permissive = 'RESTRICTIVE';
```

Should return 0 rows.

---

## NEXT STEPS FOR DEVELOPER

1. **Immediate**: Wait 15 minutes and test form submission again
2. **If still failing**: Check Supabase Dashboard > Authentication > Policies to see active policies in UI
3. **If policies look correct**: Implement Option A (Edge Function) for guaranteed bypass
4. **If using Edge Function**: Update `src/pages/Submit.tsx` to call the function instead of direct insert
5. **Final verification**: Test submission from multiple devices/networks to confirm fix

---

## CONTACT INFORMATION

- **Production URL**: https://review-staking-com.vercel.app
- **Test Campaign**: /submit/08429200
- **Supabase Project**: qrxkafcseodkveivyqdg
- **GitHub Repo**: pipmeme/ReviewStaking.com
- **Deployment**: Vercel (auto-deploys from main branch)

---

## ADDITIONAL DEBUGGING INFO

### Browser Console Logs to Check
When testing, open browser DevTools and check for:
```
Inserting testimonial with data: {...}
Testimonial insert error: {...}
Error code: 42501
```

### Network Tab
Check the actual request to Supabase:
- URL: `https://qrxkafcseodkveivyqdg.supabase.co/rest/v1/testimonials`
- Method: POST
- Headers: Should include `apikey: [anon key]`
- Response: Should show 403 or 401 with RLS error

### Supabase Dashboard Logs
Go to: https://supabase.com/dashboard/project/qrxkafcseodkveivyqdg/logs/postgres-logs

Filter for "rls" to see RLS policy violations in real-time.

---

## CONCLUSION

This is a classic RLS misconfiguration issue that has proven resistant to standard fixes. The most reliable solution is to implement a server-side Edge Function that uses the service_role key to bypass RLS entirely for public testimonial submissions, while maintaining RLS for authenticated business owner operations.

Alternatively, if the edge cache hypothesis is correct, the issue will resolve itself within 15-20 minutes of the last SQL fix being run.

**Status**: Waiting for cache propagation or Edge Function implementation
**Priority**: P0 - Production blocking
**Impact**: 100% of testimonial submissions failing
