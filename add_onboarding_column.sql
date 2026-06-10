-- ════════════════════════════════════════════════
-- Add onboarding tracking column to profiles
-- הרץ ב-Supabase SQL Editor → New Query → Run
-- ════════════════════════════════════════════════

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
