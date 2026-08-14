-- PRAGATHI 2K26 - Social Media Links Migration
-- Adds LinkedIn, Facebook, and Instagram URL fields to the public.site_settings table

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT 'https://www.linkedin.com/in/sru-pragathi-73a876429/',
ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT 'https://www.facebook.com/share/19D3TK5Yae/',
ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://www.instagram.com/sru.pragathi2.0?igsh=dng0ZXR2Y2g2enU1';

-- Update existing rows if any
UPDATE public.site_settings
SET 
  linkedin_url = COALESCE(linkedin_url, 'https://www.linkedin.com/in/sru-pragathi-73a876429/'),
  facebook_url = COALESCE(facebook_url, 'https://www.facebook.com/share/19D3TK5Yae/'),
  instagram_url = COALESCE(instagram_url, 'https://www.instagram.com/sru.pragathi2.0?igsh=dng0ZXR2Y2g2enU1');
