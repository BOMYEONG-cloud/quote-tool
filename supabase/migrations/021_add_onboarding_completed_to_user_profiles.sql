ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

UPDATE public.user_profiles
SET onboarding_completed = true
WHERE created_at < now();
