-- Add complete form customization to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{
  "fields": {
    "name": {"enabled": true, "required": true, "label": "Your Name", "placeholder": "John Doe"},
    "email": {"enabled": true, "required": false, "label": "Email", "placeholder": "you@example.com"},
    "rating": {"enabled": true, "required": true, "label": "How would you rate your experience?"},
    "text": {"enabled": true, "required": false, "label": "Your Testimonial", "placeholder": "Share your experience..."},
    "photo": {"enabled": true, "label": "Add Photos"},
    "video": {"enabled": true, "label": "Add Video"}
  },
  "customization": {
    "title": "",
    "description": "",
    "submitButtonText": "Submit Testimonial",
    "successTitle": "Thank You!",
    "successMessage": "Your testimonial has been submitted successfully and is awaiting approval.",
    "ratingEmojis": {"1": "😞 Needs Improvement", "2": "😐 Fair", "3": "👍 Good!", "4": "😊 Great!", "5": "⭐ Excellent!"}
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

-- Add form customization to businesses table (for default templates)
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS default_form_config JSONB DEFAULT '{
  "fields": {
    "name": {"enabled": true, "required": true, "label": "Your Name", "placeholder": "John Doe"},
    "email": {"enabled": true, "required": false, "label": "Email", "placeholder": "you@example.com"},
    "rating": {"enabled": true, "required": true, "label": "How would you rate your experience?"},
    "text": {"enabled": true, "required": false, "label": "Your Testimonial", "placeholder": "Share your experience..."},
    "photo": {"enabled": true, "label": "Add Photos"},
    "video": {"enabled": true, "label": "Add Video"}
  },
  "customization": {
    "title": "",
    "description": "",
    "submitButtonText": "Submit Testimonial",
    "successTitle": "Thank You!",
    "successMessage": "Your testimonial has been submitted successfully and is awaiting approval.",
    "ratingEmojis": {"1": "😞 Needs Improvement", "2": "😐 Fair", "3": "👍 Good!", "4": "😊 Great!", "5": "⭐ Excellent!"}
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
