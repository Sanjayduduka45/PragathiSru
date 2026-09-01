-- Migration: Add logo_url column to public.sponsors and setup storage bucket
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';

-- Create storage bucket for sponsor-logos if storage schema is managed via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for sponsor logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read sponsor logos'
  ) THEN
    CREATE POLICY "Public read sponsor logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'sponsor-logos');
  END IF;
END $$;

-- Admin write access for sponsor logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin insert sponsor logos'
  ) THEN
    CREATE POLICY "Admin insert sponsor logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'sponsor-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin update sponsor logos'
  ) THEN
    CREATE POLICY "Admin update sponsor logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'sponsor-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin delete sponsor logos'
  ) THEN
    CREATE POLICY "Admin delete sponsor logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'sponsor-logos');
  END IF;
END $$;
