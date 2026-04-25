-- Recréer les vues avec security_invoker=on (recommandation Lovable)
DROP VIEW IF EXISTS public.products_public CASCADE;
CREATE VIEW public.products_public
WITH (security_invoker = on) AS
SELECT
  id, code_produit, nom, slug, description, categorie_id,
  prix_vente, prix_promo,
  images, marque, matiere, entretien,
  genre, tranche_age,
  est_nouveaute, est_meilleure_vente,
  statut, created_at, updated_at
FROM public.products;

GRANT SELECT ON public.products_public TO anon, authenticated;

DROP VIEW IF EXISTS public.product_variants_public CASCADE;
CREATE VIEW public.product_variants_public
WITH (security_invoker = on) AS
SELECT
  pv.id, pv.product_id, pv.sku, pv.taille, pv.couleur,
  (pv.stock > 0) AS en_stock,
  pv.created_at
FROM public.product_variants pv;

GRANT SELECT ON public.product_variants_public TO anon, authenticated;

-- Rétablir la lecture publique sur products (mais sécurité au niveau colonne ci-dessous)
CREATE POLICY "Public reads active products"
ON public.products FOR SELECT
USING (statut = 'actif');

-- Rétablir la lecture publique sur product_variants des produits actifs
CREATE POLICY "Public reads variants of active products"
ON public.product_variants FOR SELECT
USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND p.statut = 'actif'));

-- SÉCURITÉ COLONNE : révoquer prix_achat pour anon (visiteurs non authentifiés)
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (
  id, code_produit, nom, slug, description, categorie_id,
  prix_vente, prix_promo, images, marque, matiere, entretien,
  genre, tranche_age, est_nouveaute, est_meilleure_vente,
  statut, created_at, updated_at
) ON public.products TO anon;

-- SÉCURITÉ COLONNE : révoquer stock + seuil_alerte pour anon
REVOKE SELECT ON public.product_variants FROM anon;
GRANT SELECT (
  id, product_id, sku, taille, couleur, created_at, updated_at
) ON public.product_variants TO anon;