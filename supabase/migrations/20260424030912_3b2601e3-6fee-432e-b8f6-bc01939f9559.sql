-- Allow public to read active products and their variants (via the public views and base tables)
CREATE POLICY "Public reads active products"
  ON public.products FOR SELECT
  USING (statut = 'actif');

CREATE POLICY "Public reads variants of active products"
  ON public.product_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.statut = 'actif'));
