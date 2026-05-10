-- V-1: 로그인 사용자별 프로필 (견적서 회사명 등)
-- 이전 013은 테이블이 없으면 실패했으므로, 테이블 생성 + 컬럼 + RLS를 한 파일에서 처리합니다.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  company_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS company_name text;

COMMENT ON COLUMN public.user_profiles.company_name IS '견적서 등에 표시할 회사명 (선택, V-1)';

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
