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
