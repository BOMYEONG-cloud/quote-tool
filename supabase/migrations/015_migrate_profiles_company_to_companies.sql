-- V-2A-2: user_profiles.company_name → companies.business_name, 이후 프로필 컬럼 제거
-- 기존에 companies 행이 있으면 덮어쓰지 않음(DO NOTHING).

INSERT INTO public.companies (user_id, business_name)
SELECT up.id, trim(up.company_name::text)
FROM public.user_profiles up
WHERE up.company_name IS NOT NULL
  AND length(trim(up.company_name::text)) > 0
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS company_name;
