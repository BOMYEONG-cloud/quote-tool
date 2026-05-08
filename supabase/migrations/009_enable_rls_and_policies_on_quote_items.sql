ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quote_items_select_own" ON public.quote_items;
CREATE POLICY "quote_items_select_own"
ON public.quote_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.estimates e
    WHERE e.id = quote_items.quote_id
      AND e.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "quote_items_insert_own" ON public.quote_items;
CREATE POLICY "quote_items_insert_own"
ON public.quote_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.estimates e
    WHERE e.id = quote_items.quote_id
      AND e.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "quote_items_update_own" ON public.quote_items;
CREATE POLICY "quote_items_update_own"
ON public.quote_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.estimates e
    WHERE e.id = quote_items.quote_id
      AND e.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.estimates e
    WHERE e.id = quote_items.quote_id
      AND e.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "quote_items_delete_own" ON public.quote_items;
CREATE POLICY "quote_items_delete_own"
ON public.quote_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.estimates e
    WHERE e.id = quote_items.quote_id
      AND e.owner_id = auth.uid()
  )
);

