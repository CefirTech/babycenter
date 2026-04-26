
-- Flash sales table
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  titre TEXT NOT NULL DEFAULT 'Ventes Flash',
  prix_flash NUMERIC NOT NULL CHECK (prix_flash >= 0),
  date_debut TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_fin TIMESTAMPTZ NOT NULL,
  stock_initial INTEGER NOT NULL DEFAULT 50 CHECK (stock_initial > 0),
  stock_vendu INTEGER NOT NULL DEFAULT 0 CHECK (stock_vendu >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT flash_sales_period_chk CHECK (date_fin > date_debut),
  CONSTRAINT flash_sales_stock_chk CHECK (stock_vendu <= stock_initial)
);

CREATE INDEX idx_flash_sales_product ON public.flash_sales(product_id);
CREATE INDEX idx_flash_sales_active_period ON public.flash_sales(active, date_debut, date_fin);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Public can read currently active flash sales
CREATE POLICY "Public can view active flash sales"
ON public.flash_sales
FOR SELECT
USING (
  active = true
  AND now() BETWEEN date_debut AND date_fin
);

-- Staff (admin/manager) can fully manage flash sales
CREATE POLICY "Staff can view all flash sales"
ON public.flash_sales
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can insert flash sales"
ON public.flash_sales
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can update flash sales"
ON public.flash_sales
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can delete flash sales"
ON public.flash_sales
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Auto-update updated_at
CREATE TRIGGER update_flash_sales_updated_at
BEFORE UPDATE ON public.flash_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_sales;
