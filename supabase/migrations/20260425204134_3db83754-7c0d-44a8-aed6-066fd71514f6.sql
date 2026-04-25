-- ============================================
-- PHASE 1 — SÉCURITÉ CRITIQUE
-- ============================================

-- 1. MASQUER prix_achat : remplacer la vue products_public existante
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
FROM public.products
WHERE statut = 'actif';

-- Remplacer la politique publique trop large par une politique restreinte au staff
DROP POLICY IF EXISTS "Public reads active products" ON public.products;
-- (Les politiques staff existantes restent inchangées : Staff reads all products / manages / updates / deletes)

-- 4. MASQUER stocks publics : recréer la vue product_variants_public
DROP VIEW IF EXISTS public.product_variants_public CASCADE;
CREATE VIEW public.product_variants_public
WITH (security_invoker = on) AS
SELECT
  pv.id, pv.product_id, pv.sku, pv.taille, pv.couleur,
  (pv.stock > 0) AS en_stock,
  pv.created_at
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE p.statut = 'actif';

-- Retirer la politique publique sur product_variants : le public passe désormais par la vue
DROP POLICY IF EXISTS "Public reads variants of active products" ON public.product_variants;

-- 3. CLOISONNER settings : whitelist stricte des clés vraiment publiques
DROP POLICY IF EXISTS "Public reads whitelisted settings" ON public.settings;
CREATE POLICY "Public reads whitelisted settings"
ON public.settings FOR SELECT
USING (
  cle IN ('shop_name', 'about_text', 'currency', 'free_delivery_threshold')
  OR public.is_staff(auth.uid())
);

-- 5. WITH CHECK sur profiles : empêcher de réassigner user_id
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);