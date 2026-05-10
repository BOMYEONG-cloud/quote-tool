-- companies: 미사용 기본값 컬럼 제거 (견적별로 estimates에 저장)

ALTER TABLE public.companies
  DROP COLUMN IF EXISTS default_quote_validity_days;

ALTER TABLE public.companies
  DROP COLUMN IF EXISTS default_vat_included;
