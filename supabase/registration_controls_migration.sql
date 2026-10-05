-- PRAGATHI 2K26 - Independent Registration Controls Migration
-- Safely adds sru_registration_open and external_registration_open to system_settings event_config
-- Preserves existing registration_status and all other event settings

UPDATE public.system_settings
SET value = value || '{"sru_registration_open": false, "external_registration_open": false}'::jsonb,
    updated_at = NOW()
WHERE key = 'event_config';
