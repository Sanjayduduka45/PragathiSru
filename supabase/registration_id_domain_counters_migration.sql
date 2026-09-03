-- PRAGATHI 2K26 - Domain Counters & Atomic Unique Registration ID Generator Migration (Hardened)

-- 1. DOMAIN_COUNTERS TABLE
CREATE TABLE IF NOT EXISTS public.domain_counters (
  domain_code TEXT PRIMARY KEY,
  last_real_number INT NOT NULL DEFAULT 0,
  last_test_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SEED THE 10 OFFICIAL DOMAIN CODES
INSERT INTO public.domain_counters (domain_code, last_real_number, last_test_number, updated_at)
VALUES
  ('CIV', 0, 0, NOW()),
  ('EEE', 0, 0, NOW()),
  ('MECH', 0, 0, NOW()),
  ('ECT', 0, 0, NOW()),
  ('CSAI', 0, 0, NOW()),
  ('BME', 0, 0, NOW()),
  ('AGR', 0, 0, NOW()),
  ('HBI', 0, 0, NOW()),
  ('MIS', 0, 0, NOW()),
  ('SIY', 0, 0, NOW())
ON CONFLICT (domain_code) DO NOTHING;

-- 3. ENABLE ROW LEVEL SECURITY (READ-ONLY FOR PUBLIC / ANON)
ALTER TABLE public.domain_counters ENABLE ROW LEVEL SECURITY;

-- Drop any legacy permissive write policies if they exist
DROP POLICY IF EXISTS "Allow public select domain_counters" ON public.domain_counters;
DROP POLICY IF EXISTS "Allow public insert domain_counters" ON public.domain_counters;
DROP POLICY IF EXISTS "Allow public update domain_counters" ON public.domain_counters;
DROP POLICY IF EXISTS "Allow public read-only domain_counters" ON public.domain_counters;

-- Only SELECT is permitted for anon/authenticated clients. Direct INSERT/UPDATE/DELETE are blocked.
CREATE POLICY "Allow public read-only domain_counters"
  ON public.domain_counters
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. ATOMIC RPC FUNCTION TO GENERATE NEXT UNIQUE REGISTRATION ID
CREATE OR REPLACE FUNCTION public.get_next_registration_id(
  p_domain_code TEXT,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code TEXT := UPPER(TRIM(p_domain_code));
  v_next_num INT;
  v_prefix TEXT;
  v_num_str TEXT;
BEGIN
  -- Strict domain code validation against the 10 official PRAGATHI 2K26 tracks
  IF v_code NOT IN ('CIV', 'EEE', 'MECH', 'ECT', 'CSAI', 'BME', 'AGR', 'HBI', 'MIS', 'SIY') THEN
    RAISE EXCEPTION 'Invalid PRAGATHI domain code: %', p_domain_code;
  END IF;

  -- Atomic counter increment
  IF p_is_test THEN
    UPDATE public.domain_counters
    SET last_test_number = last_test_number + 1,
        updated_at = NOW()
    WHERE domain_code = v_code
    RETURNING last_test_number INTO v_next_num;

    v_prefix := 'TEST-' || v_code;
  ELSE
    UPDATE public.domain_counters
    SET last_real_number = last_real_number + 1,
        updated_at = NOW()
    WHERE domain_code = v_code
    RETURNING last_real_number INTO v_next_num;

    v_prefix := 'PRAGATHI26-' || v_code;
  END IF;

  -- Format sequence number with minimum 2 digits (e.g. 01, 02, ... 10, 11)
  IF v_next_num < 10 THEN
    v_num_str := '0' || v_next_num::TEXT;
  ELSE
    v_num_str := v_next_num::TEXT;
  END IF;

  RETURN v_prefix || v_num_str;
END;
$$;

-- 5. PERMISSIONS FOR RPC FUNCTION
REVOKE EXECUTE ON FUNCTION public.get_next_registration_id(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_registration_id(TEXT, BOOLEAN) TO anon, authenticated, service_role;
