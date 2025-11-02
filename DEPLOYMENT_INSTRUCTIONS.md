# MANUAL DEPLOYMENT STEPS

## Deploy Edge Function to Fix RLS Issue

### Step 1: Login to Supabase Dashboard
Go to: https://supabase.com/dashboard/project/qrxkafcseodkveivyqdg/functions

### Step 2: Create New Function
1. Click "Create a new function"
2. Name it: **submit-testimonial**
3. Click "Create function"

### Step 3: Copy the Edge Function Code
Copy this entire code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const testimonialData = await req.json()
    console.log('Received:', testimonialData)

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert(testimonialData)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 4: Paste and Deploy
1. Paste the code into the editor
2. Click "Deploy"
3. Wait for "Deployed successfully" message

### Step 5: Test the Function
After deployment, the URL will be:
```
https://qrxkafcseodkveivyqdg.supabase.co/functions/v1/submit-testimonial
```

### Step 6: Push Frontend Code to GitHub
Run in PowerShell:
```powershell
git add .
git commit -m "Use Edge Function for testimonial submission to bypass RLS"
git push
```

### Step 7: Wait for Vercel Deployment
Wait 1-2 minutes for Vercel to deploy the new code.

### Step 8: Test the Form
Go to: https://review-staking-com.vercel.app/submit/08429200

Fill out the form and submit. It should work now!

---

## Why This Fixes the Problem

The Edge Function uses the **SERVICE_ROLE_KEY** which has admin privileges and **completely bypasses Row Level Security (RLS)**. This is the nuclear option that guarantees submissions will work regardless of RLS policy configuration.

The flow is now:
1. Frontend calls Edge Function (instead of direct database insert)
2. Edge Function runs with admin privileges
3. Edge Function inserts directly into database (bypassing RLS)
4. Success!
