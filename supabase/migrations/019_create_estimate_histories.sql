CREATE TABLE IF NOT EXISTS public.estimate_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  note text,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estimate_histories_quote_id_created_at_idx
  ON public.estimate_histories (quote_id, created_at DESC);

ALTER TABLE public.estimate_histories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estimate_histories_select_own" ON public.estimate_histories;
CREATE POLICY "estimate_histories_select_own"
ON public.estimate_histories
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "estimate_histories_insert_own" ON public.estimate_histories;
CREATE POLICY "estimate_histories_insert_own"
ON public.estimate_histories
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT ON public.estimate_histories TO authenticated;
