CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id
  ON public.quote_items (quote_id);

CREATE INDEX IF NOT EXISTS idx_quote_items_price_item_id
  ON public.quote_items (price_item_id);

