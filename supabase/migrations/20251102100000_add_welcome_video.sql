-- Add welcome video URL column to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS welcome_video_url TEXT DEFAULT NULL;

COMMENT ON COLUMN campaigns.welcome_video_url IS 'URL for welcome video shown at top of feedback form (YouTube, Vimeo, or direct video link)';
