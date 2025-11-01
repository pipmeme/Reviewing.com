# 🔍 COMPLETE DIAGNOSTIC GUIDE

## THE PROBLEM:
1. ✅ You can add custom questions in Dashboard
2. ❌ Custom questions don't show in the feedback form
3. ❌ Form won't submit

---

## 🧪 STEP-BY-STEP DIAGNOSIS

### **STEP 1: Check if SQL Migration Ran**

**Did you run the SQL code in Supabase?**
- ✅ YES → Go to Step 2
- ❌ NO → **DO THIS NOW!**

**How to run SQL:**
1. Go to https://supabase.com/dashboard
2. Click "SQL Editor"
3. Paste this code and click "Run":

```sql
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allow_photo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_video BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
```

---

### **STEP 2: Test Saving Custom Questions**

1. **Open Dashboard**: http://localhost:8080/dashboard
2. **Open Browser Console**: Press F12
3. **Click on a campaign** or create new one
4. **Add a custom question**:
   - Type: "What did you like most?"
   - Click "Add Question"
5. **Click "Save Campaign"**

**Check Console for:**
```
Saving campaign with data: {
  custom_questions: [{question: "...", required: false}]
}
```

**If you see ERROR:**
- `column "custom_questions" does not exist` → Run SQL migration!
- Other error → Copy the full error and tell me

---

### **STEP 3: Test Loading Campaign in Form**

1. **Copy your campaign link** (from Dashboard)
2. **Open the link** in browser
3. **Open Console** (F12)

**Check Console for:**
```
Loaded campaign data: {...}
Custom questions: [{question: "...", required: false}]
```

**What should you see on the form:**
- ✅ Your Name
- ✅ Email (optional)
- ✅ Rating stars
- ✅ Text area for testimonial
- ✅ **Your custom question(s)** under "Additional Questions"

**If custom questions DON'T show:**
- Check console - what does it say for "Custom questions: ..."?
- Is it `[]` (empty)? → Questions didn't save properly
- Is it `undefined`? → Migration didn't run

---

### **STEP 4: Test Form Submission**

1. **Fill out the form**:
   - Name: Test User
   - Rating: 5 stars
   - Text: This is a test
   - Answer custom question(s)

2. **Click Submit**

3. **Check Console**:
```
Submitting testimonial: {...}
Inserting testimonial with data: {...}
```

**Success = Toast shows "Testimonial submitted!"**
**Failure = Check console for error**

---

## 🐛 COMMON ERRORS & FIXES

### Error: `column "custom_questions" does not exist`
**Fix:** Run the SQL migration (Step 1)

### Error: `column "custom_answers" does not exist`
**Fix:** Run this SQL:
```sql
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT NULL;
```

### Error: `new row violates row-level security policy`
**Fix:** Run this SQL:
```sql
CREATE POLICY "Allow public testimonial submission"
ON testimonials FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

### Custom questions show as empty array `[]`
**Possible causes:**
1. Questions didn't save - check browser console when saving
2. Campaign didn't reload - refresh the page
3. You're viewing wrong campaign - check the campaign slug in URL

---

## 📋 WHAT TO TELL ME

After following these steps, tell me:

1. **Console output when saving campaign:**
   ```
   (Copy what you see here)
   ```

2. **Console output when loading form:**
   ```
   (Copy what you see here)
   ```

3. **Console output when submitting:**
   ```
   (Copy what you see here)
   ```

4. **Screenshots are helpful!**

---

## ⚡ QUICK FIX - RUN ALL SQL AT ONCE

If nothing works, run this complete SQL in Supabase SQL Editor:

```sql
-- Add all missing columns
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allow_photo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_video BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT NULL;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_logo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#38B2AC';

-- Fix permissions
DROP POLICY IF EXISTS "Allow public testimonial submission" ON testimonials;
CREATE POLICY "Allow public testimonial submission"
ON testimonials FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to view active campaigns" ON campaigns;
CREATE POLICY "Allow public to view active campaigns"
ON campaigns FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public to view businesses" ON businesses;
CREATE POLICY "Allow public to view businesses"
ON businesses FOR SELECT
TO anon, authenticated
USING (true);
```

**Then refresh everything and try again!**
