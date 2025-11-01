# Rating Toggle Feature

## Overview
Added `allow_rating` toggle to campaigns, allowing you to control whether the star rating field appears on the testimonial submission form for each campaign.

## What Was Changed

### 1. Database Migration
**File:** `supabase/migrations/20251101080000_add_campaign_features.sql`
- Added `allow_rating BOOLEAN DEFAULT true` column to campaigns table
- This column controls whether the star rating field shows on the form

### 2. TypeScript Types
**File:** `src/integrations/supabase/types.ts`
- Added `allow_rating` to campaigns Row, Insert, and Update types

### 3. Campaign Manager Component
**File:** `src/components/CampaignManager.tsx`
- Added `allow_rating: boolean` to Campaign interface
- Added `allow_rating: true` to default formData state
- Added "Allow Star Ratings" toggle switch in the create/edit campaign dialog
- Updated all form handling to include allow_rating field
- Updated loadCampaigns to parse allow_rating with default true

### 4. Campaign Dashboard
**File:** `src/pages/CampaignDashboard.tsx`
- Added `allow_rating: boolean` to Campaign interface
- Added allow_rating to editForm state
- Added "Allow Star Ratings" toggle in settings dialog
- Updated campaign loading and saving to include allow_rating

### 5. Submit Form
**File:** `src/pages/Submit.tsx`
- Made star rating field conditional: only shows if `campaign.allow_rating` is true
- Changed rating validation from required (1-5) to optional (0-5)
- Updated campaign loading to include allow_rating with default true

## How to Use

### Creating a Campaign with Rating Toggle
1. Go to Dashboard → Campaigns tab
2. Click "Create Campaign"
3. Fill in campaign name and description
4. Toggle "Allow Star Ratings" ON or OFF
5. Set other upload options (text/photo/video)
6. Click "Create Campaign"

### Editing Campaign Rating Setting
1. Go to Campaign Dashboard for any campaign
2. Click the Settings (gear) icon
3. Toggle "Allow Star Ratings" ON or OFF
4. Click "Save Changes"

### Result on Submit Form
- **Rating Enabled:** Star rating field appears on the form (default)
- **Rating Disabled:** Star rating field is hidden completely

## Database Migration Required

⚠️ **IMPORTANT:** You must apply the database migration before this feature works.

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to "SQL Editor"
4. Copy the contents of `supabase/migrations/20251101080000_add_campaign_features.sql`
5. Paste into the SQL editor
6. Click "Run"

## Testing

### Test 1: Create Campaign with Rating Disabled
1. Create a new campaign
2. Turn OFF "Allow Star Ratings"
3. Save the campaign
4. Visit the submit form link
5. ✅ Star rating field should NOT appear

### Test 2: Create Campaign with Rating Enabled
1. Create a new campaign
2. Keep "Allow Star Ratings" ON (default)
3. Save the campaign
4. Visit the submit form link
5. ✅ Star rating field should appear

### Test 3: Edit Existing Campaign
1. Go to any campaign's dashboard
2. Click Settings
3. Toggle "Allow Star Ratings" OFF
4. Save changes
5. Visit the submit form
6. ✅ Star rating field should disappear
7. Toggle it back ON and save
8. ✅ Star rating field should reappear

## Default Behavior
- All new campaigns have `allow_rating = true` by default
- Existing campaigns (after migration) will have `allow_rating = true`
- Rating field accepts values 0-5, with 0 representing "no rating"

## Files Modified
1. `supabase/migrations/20251101080000_add_campaign_features.sql`
2. `src/integrations/supabase/types.ts`
3. `src/components/CampaignManager.tsx`
4. `src/pages/CampaignDashboard.tsx`
5. `src/pages/Submit.tsx`
