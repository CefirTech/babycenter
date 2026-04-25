-- Recréer products_public sans security_invoker (utilise les droits du owner = postgres)
DROP VIEW IF EXISTS public.products_public CASCADE;
CREATE VIEW public.products_public AS
SELECT
  id, code_produit, nom, slug, description, categorie_id,
  prix_vente, prix_promo,
  images, marque, matiere, entretien,
  genre, tranche_age,
  est_nouveaute, est_meilleure_vente,
  statut, created_at, updated_at
FROM public.products
WHERE statut = 'actif';

-- Autoriser anon et authenticated à lire la vue (sans RLS sur la vue, c'est le grant qui compte)
GRANT SELECT ON public.products_public TO anon, authenticated;

-- Recréer product_variants_public sans security_invoker
DROP VIEW IF EXISTS public.product_variants_public CASCADE;
CREATE VIEW public.product_variants_public AS
SELECT
  pv.id, pv.product_id, pv.sku, pv.taille, pv.couleur,
  (pv.stock > 0) AS en_stock,
  pv.created_at
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE p.statut = 'actif';

GRANT SELECT ON public.product_variants_public TO anon, authenticated;