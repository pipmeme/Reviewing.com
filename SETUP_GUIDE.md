# Quick Start Guide - Campaign Feature

## 🚀 Setup Instructions

### 1. Apply Database Migration

You need to apply the database migration to add campaign features to your Supabase database.

**Option A: Using Supabase Dashboard (Recommended for hosted projects)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251101080000_add_campaign_features.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

**Option B: Using Supabase CLI (for local development)**
```bash
# Make sure you're in the project directory
cd c:\Users\numan\Downloads\trustworthly-boost-main\trustworthly-boost-main

# Apply the migration
supabase db push
```

### 2. Verify Dev Server is Running

The dev server should already be running at:
- **http://localhost:8080/** (dev server)
- **http://localhost:4173/** (production preview)

If not running, restart it:
```powershell
npm run dev
```

### 3. Test the Campaign Feature

#### A. Login to Dashboard
1. Open http://localhost:8080/
2. Sign in or create an account
3. Go to Dashboard

#### B. Create Your First Campaign
1. Click the **"Campaigns"** tab in the Dashboard
2. Click **"New Campaign"** button
3. Fill in the form:
   ```
   Campaign Name: Product A Testimonials
   Description: Share your experience with Product A
   
   Custom Questions:
   - "What features do you love most?" (Required)
   - "How has Product A improved your workflow?" (Required)
   
   Options:
   ✓ Allow Text Testimonials
   ✓ Allow Photo Uploads
   ✗ Allow Video Uploads (optional - disable for this test)
   ```
4. Click **"Create Campaign"**

#### C. Test the Campaign Link
1. In the Campaigns table, find your new campaign
2. Click the **"Copy"** icon to copy the campaign link
3. Open the link in a new browser tab/incognito window
   - Example: `http://localhost:8080/submit/product-a-testimonials`

#### D. Submit a Test Testimonial
1. On the campaign submit page, fill out:
   ```
   Name: John Doe
   Email: john@example.com
   
   Custom Question 1: "I love the intuitive interface!"
   Custom Question 2: "It's saved me 5 hours a week!"
   
   Rating: 5 stars
   Feedback: "Product A is amazing! Highly recommended."
   
   Photo: Upload a test image (optional)
   ```
2. Click **"Submit Testimonial"**

#### E. View Testimonial in Dashboard
1. Go back to the Dashboard
2. Click the **"Testimonials"** tab
3. In the campaign filter dropdown, select **"Product A Testimonials"**
4. You should see your test testimonial
5. Approve it by clicking the green checkmark

### 4. Test Different Campaign Types

Try creating these campaigns to explore the feature:

**Survey Campaign (Text Only)**
```
Name: Customer Satisfaction Survey
Description: Help us improve
Allow: Text only (disable photo & video)
Questions: 
- "What do you like most about our service?"
- "What could we improve?"
```

**Video Testimonial Campaign**
```
Name: Video Success Stories
Description: Record a quick video about your experience
Allow: Video only (disable text & photo)
Questions:
- "Tell us your story in 30-60 seconds"
```

**Product-Specific Campaign**
```
Name: Feature X Feedback
Description: Share your thoughts on our new Feature X
Allow: Text + Photo
Questions:
- "How easy was Feature X to use?"
- "Did Feature X solve your problem?"
```

## 🎯 What You Can Do Now

### Multi-Product Testimonials
- Create separate campaigns for each product/service
- Track testimonials per product
- Filter dashboard by product

### Custom Feedback Forms
- Add unlimited custom questions
- Mark questions as required/optional
- Collect structured feedback data

### Flexible Upload Options
- Enable/disable text, photo, video per campaign
- Create video-only testimonial campaigns
- Build text-only surveys

### Campaign Management
- Edit campaign settings anytime
- View unique campaign links
- Track testimonials by campaign
- Filter dashboard analytics

## 📊 Dashboard Features

### Campaigns Tab
- Create/edit/delete campaigns
- View campaign slugs
- Copy campaign links
- See upload options at a glance

### Testimonials Tab
- Filter by campaign using dropdown
- View all testimonials or filter by specific campaign
- See "No Campaign" for legacy testimonials
- Analytics update based on selected filter

## 🔗 Campaign URLs

Campaign URLs are automatically generated from the campaign name:

| Campaign Name | Generated Slug |
|--------------|----------------|
| Product A Reviews | product-a-reviews |
| Customer Feedback 2025 | customer-feedback-2025 |
| Video Testimonials | video-testimonials |
| Q4 Survey | q4-survey |

The slug is:
- Lowercase
- Spaces replaced with hyphens
- Special characters removed
- Made unique with counter if needed

## 🐛 Troubleshooting

**Migration Error?**
- Make sure you're connected to your Supabase project
- Check that you have admin access to run SQL
- Try running the migration SQL in smaller chunks

**Campaign not saving?**
- Check browser console for errors
- Verify Supabase connection in `.env` file
- Make sure RLS policies are applied

**Can't see testimonials?**
- Check the campaign filter - make sure "All Testimonials" is selected
- Verify testimonials were submitted with campaign_id
- Check testimonial status (pending vs approved)

**Campaign link 404?**
- Verify the route is correct: `/submit/campaign-slug` not `/submit/business-id`
- Check that the campaign exists and has a slug
- Try refreshing the page

## 🎉 Success!

You now have a fully functional campaign system that allows you to:
✅ Create unlimited custom feedback forms
✅ Share unique links for each campaign
✅ Collect product-specific testimonials
✅ Filter and manage testimonials by campaign
✅ Customize questions and upload options

Need help? Check `CAMPAIGN_FEATURE.md` for detailed documentation.
