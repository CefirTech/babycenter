-- Lier ventes aux sessions de caisse + annulation + paiements mixtes
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'validee',
  ADD COLUMN IF NOT EXISTS annulee_le timestamptz,
  ADD COLUMN IF NOT EXISTS annulee_par uuid,
  ADD COLUMN IF NOT EXISTS motif_annulation text,
  ADD COLUMN IF NOT EXISTS paiements jsonb,
  ADD COLUMN IF NOT EXISTS montant_recu numeric;

-- Remise par ligne
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS remise_ligne numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sales_session_id ON public.sales(session_id);
CREATE INDEX IF NOT EXISTS idx_sales_statut ON public.sales(statut);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);