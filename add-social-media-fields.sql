-- =====================================================
-- Add Social Media Fields to Directory Members Table
-- =====================================================

ALTER TABLE directory_members 
ADD COLUMN facebook_url VARCHAR(500) NULL AFTER twitter_url,
ADD COLUMN instagram_url VARCHAR(500) NULL AFTER facebook_url,
ADD COLUMN tiktok_url VARCHAR(500) NULL AFTER instagram_url,
ADD COLUMN threads_url VARCHAR(500) NULL AFTER tiktok_url,
ADD COLUMN youtube_url VARCHAR(500) NULL AFTER threads_url,
ADD COLUMN reddit_url VARCHAR(500) NULL AFTER youtube_url;

-- Add indexes for better search performance
CREATE INDEX idx_linkedin_url ON directory_members(linkedin_url(100));
CREATE INDEX idx_twitter_url ON directory_members(twitter_url(100));
CREATE INDEX idx_facebook_url ON directory_members(facebook_url(100));
CREATE INDEX idx_instagram_url ON directory_members(instagram_url(100));




