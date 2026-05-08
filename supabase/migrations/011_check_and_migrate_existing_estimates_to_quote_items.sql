-- 1) 기존 estimates 데이터 건수 확인
SELECT COUNT(*) AS estimates_count
FROM public.estimates;

-- 2) 데이터가 있을 때 선택지 A (권장: 마이그레이션)
-- 기존 견적의 total_amount를 단일 항목으로 quote_items에 이관
-- 주의: 이미 quote_items가 있는 견적은 중복 생성 방지를 위해 제외
INSERT INTO public.quote_items (
  quote_id,
  price_item_id,
  internal_name,
  customer_name,
  unit,
  quantity,
  unit_cost_price,
  unit_customer_price,
  subtotal_cost,
  subtotal_customer,
  sort_order
)
SELECT
  e.id AS quote_id,
  NULL::uuid AS price_item_id,
  '기존 합계 이관 항목' AS internal_name,
  COALESCE(e.project_name, '기존 견적 합계') AS customer_name,
  '식' AS unit,
  1::numeric AS quantity,
  NULL::numeric AS unit_cost_price,
  COALESCE(e.total_amount, 0)::numeric AS unit_customer_price,
  NULL::numeric AS subtotal_cost,
  COALESCE(e.total_amount, 0)::numeric AS subtotal_customer,
  0 AS sort_order
FROM public.estimates e
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quote_items qi
  WHERE qi.quote_id = e.id
);

-- 3) 데이터가 있을 때 선택지 B (테스트 데이터면 삭제)
-- DELETE FROM public.estimates;

