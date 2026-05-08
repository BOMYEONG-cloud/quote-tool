CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  price_item_id uuid REFERENCES public.price_items(id) ON DELETE SET NULL,
  internal_name text NOT NULL,
  customer_name text NOT NULL,
  unit text NOT NULL,
  quantity numeric NOT NULL,
  unit_cost_price numeric,
  unit_customer_price numeric NOT NULL,
  subtotal_cost numeric,
  subtotal_customer numeric NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

