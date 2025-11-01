# Campaign Feature Implementation

## Overview
This implementation adds a powerful campaign management system that allows you to create multiple custom feedback/testimonial forms, each with:
- Unique shareable links
- Custom questions
- Toggleable upload options (text, photo, video)
- Campaign-specific testimonial filtering

## What's New

### 1. **Database Schema**
- Extended `campaigns` table with:
  - `description` - Optional campaign description
  - `custom_questions` - JSONB array of custom questions
  - `allow_video`, `allow_photo`, `allow_text` - Toggle upload options
  - `unique_slug` - Auto-generated unique URL slug
  - `updated_at` - Timestamp for updates

- Added `campaign_id` to `testimonials` table to link testimonials to campaigns

### 2. **Campaign Manager Component** (`src/components/CampaignManager.tsx`)
A full-featured UI for managing campaigns:
- Create/edit/delete campaigns
- Add custom questions with required/optional flags
- Toggle video/photo/text upload options
- Copy campaign links
- View campaign slugs

### 3. **Updated Submit Page** (`src/pages/Submit.tsx`)
Now supports two modes:
- **Legacy mode**: `/submit/:businessId` - Original universal testimonial form
- **Campaign mode**: `/submit/:campaignSlug` - Campaign-specific form

Campaign mode features:
- Displays campaign name and description
- Renders custom questions dynamically
- Conditionally shows/hides upload options based on campaign settings
- Links submitted testimonials to the campaign

### 4. **Enhanced Dashboard** (`src/pages/Dashboard.tsx`)
- New "Campaigns" tab with full campaign management
- Campaign filter dropdown to view testimonials by campaign
- Renamed "Email Campaigns" tab for clarity
- Real-time filtering of analytics based on selected campaign

### 5. **Updated Types** (`src/integrations/supabase/types.ts`)
- Added all new campaign fields to TypeScript definitions
- Added `campaign_id` to testimonials type

## How to Use

### Step 1: Apply Database Migration
Run the new migration to add campaign features:
```bash
# If using Supabase CLI
supabase db push

# Or manually apply the migration file:
# supabase/migrations/20251101080000_add_campaign_features.sql
```

### Step 2: Create a Campaign
1. Go to Dashboard → Campaigns tab
2. Click "New Campaign"
3. Fill in:
   - Campaign Name (e.g., "Product A Feedback")
   - Description (optional)
   - Custom Questions (click + to add)
   - Toggle upload options (text, photo, video)
4. Click "Create Campaign"

### Step 3: Share Campaign Link
- Each campaign gets a unique slug (auto-generated from name)
- Copy the link: `yourdomain.com/submit/product-a-feedback`
- Share with customers

### Step 4: View Testimonials
- Go to Dashboard → Testimonials tab
- Use the campaign filter dropdown to view testimonials by campaign
- Analytics update based on selected filter

## Example Use Cases

### 1. **Product-Specific Testimonials**
Create campaigns for each product:
- `/submit/product-a-reviews`
- `/submit/product-b-reviews`
- `/submit/product-c-reviews`

### 2. **Customer Feedback Survey**
Disable video/photo uploads, add custom questions:
```
Campaign: "Q4 Customer Satisfaction"
Questions:
- What features do you use most?
- What would you like to see improved?
- How likely are you to recommend us? (1-10)
```

### 3. **Event Testimonials**
```
Campaign: "Conference 2025 Feedback"
Questions:
- Which session did you attend?
- What was your favorite part?
- Suggestions for next year?
Allow: Text + Photo (no video)
```

### 4. **Video-Only Testimonials**
```
Campaign: "Video Success Stories"
Allow: Video only (disable text and photo)
Questions:
- Tell us about your experience
- What problem did we solve for you?
```

## Technical Details

### Campaign Slug Generation
- Automatically generated from campaign name
- Lowercase, spaces → hyphens, special chars removed
- Uniqueness enforced with counter suffix if needed
- Example: "Product A Reviews" → "product-a-reviews"

### Custom Questions Format
Stored as JSONB:
```json
[
  { "question": "What did you like most?", "required": true },
  { "question": "Any suggestions?", "required": false }
]
```

### RLS Policies
- Public can view campaigns by slug (for submit form)
- Business owners can CRUD their own campaigns
- Testimonials inherit existing business ownership policies
- Campaign filter respects business ownership

### Backward Compatibility
- Existing `/submit/:businessId` routes still work
- Testimonials without campaign_id show as "No Campaign" in filter
- All existing functionality preserved

## Files Modified
1. `supabase/migrations/20251101080000_add_campaign_features.sql` - Database schema
2. `src/integrations/supabase/types.ts` - TypeScript types
3. `src/components/CampaignManager.tsx` - New component
4. `src/pages/Submit.tsx` - Campaign-aware submit form
5. `src/pages/Dashboard.tsx` - Campaign management & filtering
6. `src/App.tsx` - Updated routing

## Next Steps / Future Enhancements
- Add campaign analytics (conversion rates, avg ratings per campaign)
- Campaign templates for common use cases
- Bulk campaign operations
- Export testimonials by campaign
- Campaign archiving/pausing
- A/B testing different campaign configurations
