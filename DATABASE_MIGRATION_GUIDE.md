# 🗄️ Database Migration Guide

## ⚠️ CRITICAL: Apply These Migrations First!

Your form builder system is ready, but the database columns don't exist yet. You MUST apply these 4 SQL migrations in Supabase before the TypeScript errors will go away.

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Log in and select your project
3. Click **SQL Editor** in the left sidebar

### 2. Apply Migrations (IN THIS ORDER!)

#### Migration 1: Campaign Features
**File:** `supabase/migrations/20251101080000_add_campaign_features.sql`

```sql
-- Add campaign system with unique slugs and toggles
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS unique_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS allow_video BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_photo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_text BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_rating BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- Generate unique slugs for existing campaigns
UPDATE campaigns 
SET unique_slug = CONCAT(
  LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')), 
  '-', 
  SUBSTR(MD5(id::text), 1, 6)
)
WHERE unique_slug IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(unique_slug);
```

**Action:** Copy the above SQL, paste into SQL Editor, click **Run**

---

#### Migration 2: Make Text Optional
**File:** `supabase/migrations/20251101090000_make_text_optional.sql`

```sql
-- Remove text field validation (make it optional)
ALTER TABLE testimonials 
  ALTER COLUMN text DROP NOT NULL;

-- Allow empty text
ALTER TABLE testimonials 
  ALTER COLUMN text SET DEFAULT '';
```

**Action:** Copy the above SQL, paste into SQL Editor, click **Run**

---

#### Migration 3: Notifications, Branding & Analytics
**File:** `supabase/migrations/20251101100000_add_notifications_branding_analytics.sql`

```sql
-- Add email notification settings
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_on_new BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_approval BOOLEAN DEFAULT false;

-- Add branding customization
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS custom_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT '{"primary": "#4FD1C5", "secondary": "#38B2AC"}'::jsonb,
  ADD COLUMN IF NOT EXISTS show_branding BOOLEAN DEFAULT true;

-- Add analytics columns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_submitted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_submission_at TIMESTAMPTZ;

-- Add analytics tracking
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_ip TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_testimonials_submitted_at ON testimonials(submitted_at);
CREATE INDEX IF NOT EXISTS idx_testimonials_campaign_status ON testimonials(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON campaigns(business_id);
```

**Action:** Copy the above SQL, paste into SQL Editor, click **Run**

---

#### Migration 4: Form Customization (100% Customizable Forms!)
**File:** `supabase/migrations/20251101110000_add_form_customization.sql`

```sql
-- Add form_config column to campaigns for complete customization
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{
    "fields": {
      "name": {
        "enabled": true,
        "required": true,
        "label": "Your Name",
        "placeholder": "John Doe"
      },
      "email": {
        "enabled": true,
        "required": false,
        "label": "Email",
        "placeholder": "you@example.com"
      },
      "rating": {
        "enabled": true,
        "required": true,
        "label": "How would you rate your experience?"
      },
      "text": {
        "enabled": true,
        "required": false,
        "label": "Your Testimonial",
        "placeholder": "Share your experience..."
      },
      "photo": {
        "enabled": true,
        "label": "Add Photos"
      },
      "video": {
        "enabled": true,
        "label": "Add Video"
      }
    },
    "customization": {
      "title": "",
      "description": "",
      "submitButtonText": "Submit Testimonial",
      "successTitle": "Thank You!",
      "successMessage": "Your testimonial has been submitted successfully and is awaiting approval.",
      "ratingEmojis": {
        "1": "😞 Needs Improvement",
        "2": "😐 Fair",
        "3": "👍 Good!",
        "4": "😊 Great!",
        "5": "⭐ Excellent!"
      }
    },
    "styling": {
      "primaryColor": "#4FD1C5",
      "secondaryColor": "#38B2AC",
      "fontFamily": "Inter",
      "borderRadius": "12px",
      "showLogo": true,
      "showPoweredBy": true
    }
  }'::jsonb;

-- Add form_config to businesses for global defaults
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS default_form_config JSONB DEFAULT '{
    "fields": {
      "name": {
        "enabled": true,
        "required": true,
        "label": "Your Name",
        "placeholder": "John Doe"
      },
      "email": {
        "enabled": true,
        "required": false,
        "label": "Email",
        "placeholder": "you@example.com"
      },
      "rating": {
        "enabled": true,
        "required": true,
        "label": "How would you rate your experience?"
      },
      "text": {
        "enabled": true,
        "required": false,
        "label": "Your Testimonial",
        "placeholder": "Share your experience..."
      },
      "photo": {
        "enabled": true,
        "label": "Add Photos"
      },
      "video": {
        "enabled": true,
        "label": "Add Video"
      }
    },
    "customization": {
      "title": "",
      "description": "",
      "submitButtonText": "Submit Testimonial",
      "successTitle": "Thank You!",
      "successMessage": "Your testimonial has been submitted successfully and is awaiting approval.",
      "ratingEmojis": {
        "1": "😞 Needs Improvement",
        "2": "😐 Fair",
        "3": "👍 Good!",
        "4": "😊 Great!",
        "5": "⭐ Excellent!"
      }
    },
    "styling": {
      "primaryColor": "#4FD1C5",
      "secondaryColor": "#38B2AC",
      "fontFamily": "Inter",
      "borderRadius": "12px",
      "showLogo": true,
      "showPoweredBy": true
    }
  }'::jsonb;

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_campaigns_form_config ON campaigns USING gin (form_config);
CREATE INDEX IF NOT EXISTS idx_businesses_default_form_config ON businesses USING gin (default_form_config);
```

**Action:** Copy the above SQL, paste into SQL Editor, click **Run**

---

## ✅ Verification

After running all 4 migrations, verify they worked:

```sql
-- Check campaigns table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns'
ORDER BY column_name;

-- Check businesses table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY column_name;
```

You should see:
- `campaigns`: `unique_slug`, `allow_video`, `allow_photo`, `allow_text`, `allow_rating`, `custom_questions`, `form_config`, `total_sent`, `total_submitted`
- `businesses`: `notification_email`, `notify_on_new`, `custom_logo_url`, `custom_colors`, `show_branding`, `default_form_config`

---

## 🎉 What Happens Next

Once migrations are applied:

1. **TypeScript errors disappear** ✅
2. **Form Builder becomes functional** ✅
3. **100% customization works** ✅
4. **Branding settings work** ✅
5. **Email notifications ready** ✅
6. **Advanced analytics operational** ✅

---

## 🚨 Troubleshooting

### Error: "column already exists"
**Solution:** That migration was already applied! Skip to the next one.

### Error: "permission denied"
**Solution:** Make sure you're logged in as the project owner in Supabase.

### Error: "syntax error"
**Solution:** Make sure you copied the ENTIRE SQL block, including all lines.

---

## 📝 What Each Migration Does

| Migration | Purpose | Columns Added |
|-----------|---------|---------------|
| **1. Campaign Features** | Multi-campaign system with unique links | `unique_slug`, `allow_*` toggles, `custom_questions` |
| **2. Make Text Optional** | Remove validation barriers | Modify `text` column constraints |
| **3. Notifications/Branding** | Enterprise features | `notification_email`, `custom_logo_url`, `custom_colors`, analytics columns |
| **4. Form Customization** | 100% customizable forms | `form_config`, `default_form_config` |

---

## 🎯 Next Steps

After migrations are complete:

1. **Restart your dev server** (if running)
2. **Go to any campaign dashboard**
3. **Click "Form Builder" tab**
4. **Start customizing!**

You can now:
- ✅ Edit every text label
- ✅ Toggle any field on/off
- ✅ Customize colors and fonts
- ✅ Preview customer view
- ✅ Save configurations per campaign
- ✅ Have COMPLETE control! 🎨

---

**Need help?** All migration files are in `supabase/migrations/` folder!
