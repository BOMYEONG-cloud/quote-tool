-- 견적: 고객에게 보이는 비고, 일괄 마진 금액(행 소계에 수량 비례 분배)
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS customer_notes text,
  ADD COLUMN IF NOT EXISTS margin_flat_amount numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.estimates.customer_notes IS '고객 공개 비고(미리보기·PDF·문자 등)';
COMMENT ON COLUMN public.estimates.margin_flat_amount IS '일괄 마진(원). 총 수량 대비 비례해 각 행 소계에 가산';
