-- PRAGATHI 2K26 - Manual Payment Verification Migration
-- Run this in your Supabase SQL Editor to support private payment proof uploads and verification status.

-- 1. ADD payment_proof_path COLUMN TO public.payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_proof_path TEXT NULL;

-- 2. CREATE PRIVATE STORAGE BUCKET FOR PAYMENT PROOFS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false, -- PRIVATE BUCKET (Critical Security Rule)
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR payment-proofs BUCKET
-- Allow public insert (upload during registration)
CREATE POLICY "Allow public insert payment-proofs" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

-- Restrict direct public select access; signed URLs / service role are used for reading
CREATE POLICY "Allow service role and authenticated select payment-proofs" ON storage.objects
  FOR SELECT TO authenticated, service_role
  USING (bucket_id = 'payment-proofs');

-- Allow authenticated update/delete for payment-proofs
CREATE POLICY "Allow authenticated update payment-proofs" ON storage.objects
  FOR UPDATE TO authenticated, service_role
  USING (bucket_id = 'payment-proofs')
  WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow authenticated delete payment-proofs" ON storage.objects
  FOR DELETE TO authenticated, service_role
  USING (bucket_id = 'payment-proofs');
