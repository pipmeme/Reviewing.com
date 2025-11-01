# 🔧 TROUBLESHOOTING GUIDE

## Quick Diagnosis

### ✅ Step 1: Did you run the SQL migration?
If you haven't, **THIS IS THE PROBLEM**. Go back and run the SQL code I gave you in Supabase SQL Editor.

---

## 🧪 Step 2: Test the Form

1. **Open your website**: http://localhost:8080/
2. **Open Browser Console**: Press `F12` or `Ctrl+Shift+I`
3. **Click on "Console" tab**
4. **Try to submit the form**

---

## 📋 What to Look For in Console

### ✅ If Migration Worked:
You'll see:
```
Submitting testimonial: {name: "...", rating: 5, ...}
Inserting testimonial with data: {...}
```
Then form submits successfully!

### ❌ If Migration DIDN'T Work:
You'll see errors like:
```
Error: column "custom_answers" does not exist
Error: column "photo_urls" does not exist
Error: column "custom_logo_url" does not exist
```

**Solution**: Run the SQL migration!

---

## 🐛 Common Issues & Fixes

### Issue 1: "Please select a rating"
**Fix**: Click on the stars to rate (1-5 stars)

### Issue 2: "Please enter your name"
**Fix**: Name must be at least 2 characters

### Issue 3: "Column does not exist"
**Fix**: You didn't run the SQL migration. Run it now:
1. Go to https://supabase.com/dashboard
2. Click SQL Editor
3. Paste the SQL code I gave you
4. Click Run

### Issue 4: "Permission denied" or "RLS policy"
**Fix**: The SQL migration also fixes permissions. Run it.

### Issue 5: Custom questions not showing
**Fix**: 
- Make sure your campaign has custom_questions in the database
- The migration adds this column automatically

---

## 📞 Next Steps

**After you:**
1. Run the SQL migration
2. Refresh the page (Ctrl+Shift+R)
3. Open browser console (F12)
4. Try submitting the form

**Tell me:**
- What do you see in the console?
- Any error messages?
- Does it submit successfully?

**I can help you more once I know what the console says!**
