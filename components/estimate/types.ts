export type Estimate = {
  id: string;
  owner_id: string;
  quote_number: string | null;
  customer_name: string;
  project_name: string;
  site_name: string | null;
  construction_type: string | null;
  validity_days: number;
  issued_date: string;
  internal_memo: string | null;
  /** 고객에게 노출되는 비고(계좌, 계약 조건 등) */
  customer_notes?: string | null;
  /** 일괄 마진(원). 항목 소계(수량×단가) 합에 더해 합계 산출 시 각 행 수량 비례 분배 */
  margin_flat_amount?: number | null;
  subtotal_customer: number;
  vat_amount: number;
  vat_included: boolean;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  price_item_id: string | null;
  internal_name: string;
  customer_name: string;
  unit: string;
  quantity: number;
  unit_cost_price: number | null;
  unit_customer_price: number;
  subtotal_cost: number | null;
  subtotal_customer: number;
  sort_order: number;
  created_at: string;
};

export type EstimateHistory = {
  id: string;
  quote_id: string;
  owner_id: string;
  action: string;
  note: string | null;
  snapshot: Record<string, unknown> | null;
  created_at: string;
};
