-- V-2A-1: 회사 정보 (정식 견적서용). user_profiles.company_name은 V-2A-2에서 이관 후 제거 예정.

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  business_name text NOT NULL,
  representative_name text,
  business_number text,
  address text,
  phone text,
  email text,
  logo_url text,
  stamp_url text,
  default_quote_validity_days integer NOT NULL DEFAULT 30,
  default_vat_included boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT companies_user_id_key UNIQUE (user_id)
);

COMMENT ON TABLE public.companies IS 'V-2A: 로그인 사용자당 1행, 견적서·PDF·카톡용 회사 정보';

CREATE INDEX IF NOT EXISTS companies_user_id_idx ON public.companies (user_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.set_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_set_updated_at ON public.companies;
CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_companies_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
CREATE POLICY "companies_select_own"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
CREATE POLICY "companies_insert_own"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
CREATE POLICY "companies_update_own"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_delete_own" ON public.companies;
CREATE POLICY "companies_delete_own"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
