-- Add video_autoplay column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS video_autoplay BOOLEAN DEFAULT true;

-- Update existing campaigns to have autoplay enabled by default
UPDATE campaigns 
SET video_autoplay = true 
WHERE video_autoplay IS NULL;
