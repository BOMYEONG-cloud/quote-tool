export type PriceItem = {
  id: string;
  owner_id: string;
  category: string;
  internal_name: string;
  customer_name: string;
  unit: string;
  cost_price: number | null;
  margin_rate: number | null;
  customer_price: number;
  memo: string | null;
  usage_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

