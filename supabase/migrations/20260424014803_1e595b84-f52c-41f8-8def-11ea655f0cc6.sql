-- =========================================================
-- 1. VUES PUBLIQUES (masquer prix_achat, stock détaillé)
-- =========================================================

-- Vue publique produits (sans prix_achat)
CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker=on) AS
SELECT
  id, code_produit, nom, slug, description, categorie_id, tranche_age,
  genre, marque, prix_vente, prix_promo, images, statut, est_nouveaute,
  est_meilleure_vente, matiere, entretien, created_at, updated_at
FROM public.products
WHERE statut = 'actif';

GRANT SELECT ON public.products_public TO anon, authenticated;

-- Vue publique variants (sans stock numérique précis ni seuil)
CREATE OR REPLACE VIEW public.product_variants_public
WITH (security_invoker=on) AS
SELECT
  id, product_id, taille, couleur, sku,
  (stock > 0) AS en_stock,
  created_at
FROM public.product_variants;

GRANT SELECT ON public.product_variants_public TO anon, authenticated;

-- Restreindre la lecture publique de products : seul le staff voit prix_achat
DROP POLICY IF EXISTS "Public reads active products" ON public.products;
CREATE POLICY "Staff reads all products"
  ON public.products FOR SELECT
  USING (is_staff(auth.uid()));

-- Restreindre product_variants : staff seulement (le public utilise la vue)
DROP POLICY IF EXISTS "Public reads variants" ON public.product_variants;
CREATE POLICY "Staff reads variants"
  ON public.product_variants FOR SELECT
  USING (is_staff(auth.uid()));

-- =========================================================
-- 2. PROMOTIONS — masquer la liste, exposer une RPC de validation
-- =========================================================
DROP POLICY IF EXISTS "Public reads active promotions" ON public.promotions;
CREATE POLICY "Staff reads promotions"
  ON public.promotions FOR SELECT
  USING (is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _montant numeric DEFAULT 0)
RETURNS TABLE (
  id uuid,
  code text,
  nom text,
  type promotion_type,
  valeur numeric,
  montant_min_commande numeric,
  valid boolean,
  reason text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
BEGIN
  SELECT * INTO p FROM public.promotions
   WHERE upper(code) = upper(_code) AND active = true LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, _code, NULL::text, NULL::promotion_type, NULL::numeric, NULL::numeric, false, 'Code invalide';
    RETURN;
  END IF;
  IF p.date_fin IS NOT NULL AND p.date_fin < now() THEN
    RETURN QUERY SELECT p.id, p.code, p.nom, p.type, p.valeur, p.montant_min_commande, false, 'Code expiré'; RETURN;
  END IF;
  IF p.date_debut > now() THEN
    RETURN QUERY SELECT p.id, p.code, p.nom, p.type, p.valeur, p.montant_min_commande, false, 'Code pas encore actif'; RETURN;
  END IF;
  IF p.utilisations_max IS NOT NULL AND p.utilisations >= p.utilisations_max THEN
    RETURN QUERY SELECT p.id, p.code, p.nom, p.type, p.valeur, p.montant_min_commande, false, 'Code épuisé'; RETURN;
  END IF;
  IF p.montant_min_commande IS NOT NULL AND _montant < p.montant_min_commande THEN
    RETURN QUERY SELECT p.id, p.code, p.nom, p.type, p.valeur, p.montant_min_commande, false, 'Montant minimum non atteint'; RETURN;
  END IF;
  RETURN QUERY SELECT p.id, p.code, p.nom, p.type, p.valeur, p.montant_min_commande, true, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon, authenticated;

-- =========================================================
-- 3. SETTINGS — whitelist publique
-- =========================================================
DROP POLICY IF EXISTS "Public reads settings" ON public.settings;
CREATE POLICY "Public reads whitelisted settings"
  ON public.settings FOR SELECT
  USING (cle IN ('branding','contact','shipping','site') OR is_staff(auth.uid()));

-- =========================================================
-- 4. FOREIGN KEYS manquantes
-- =========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_items_order_id_fkey') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_items_product_id_fkey') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_items_variant_id_fkey') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_customer_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sale_items_sale_id_fkey') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_sale_id_fkey
      FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sale_items_product_id_fkey') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sale_items_variant_id_fkey') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_customer_id_fkey') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_session_id_fkey') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cash_movements_session_id_fkey') THEN
    ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='product_variants_product_id_fkey') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_categorie_id_fkey') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_categorie_id_fkey
      FOREIGN KEY (categorie_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='categories_parent_id_fkey') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================
-- 5. TRIGGERS updated_at manquants
-- =========================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['products','product_variants','categories','customers','orders','promotions','expenses','settings','profiles']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- =========================================================
-- 6. RPC create_sale_atomic
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_sale_atomic(
  _numero_vente text,
  _customer_id uuid,
  _session_id uuid,
  _vendeur_id uuid,
  _vendeur_nom text,
  _mode_paiement payment_method,
  _paiements jsonb,
  _montant_recu numeric,
  _sous_total numeric,
  _remise numeric,
  _total numeric,
  _notes text,
  _items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_qte int;
  v_stock int;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Vérifier stock suffisant pour chaque ligne
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qte := (v_item->>'quantite')::int;
    IF v_variant_id IS NOT NULL THEN
      SELECT stock INTO v_stock FROM public.product_variants WHERE id = v_variant_id FOR UPDATE;
      IF v_stock IS NULL OR v_stock < v_qte THEN
        RAISE EXCEPTION 'Stock insuffisant pour %', (v_item->>'product_nom');
      END IF;
    END IF;
  END LOOP;

  -- Créer la vente
  INSERT INTO public.sales (
    numero_vente, customer_id, session_id, vendeur_id, vendeur_nom,
    mode_paiement, paiements, montant_recu, sous_total, remise, total, notes, statut
  ) VALUES (
    _numero_vente, _customer_id, _session_id, _vendeur_id, _vendeur_nom,
    _mode_paiement, _paiements, _montant_recu, _sous_total, _remise, _total, _notes, 'validee'
  ) RETURNING id INTO v_sale_id;

  -- Créer les items et décrémenter le stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    INSERT INTO public.sale_items (
      sale_id, product_id, variant_id, product_nom, taille, couleur,
      prix_unitaire, quantite, remise_ligne, total
    ) VALUES (
      v_sale_id,
      NULLIF(v_item->>'product_id','')::uuid,
      NULLIF(v_item->>'variant_id','')::uuid,
      v_item->>'product_nom',
      v_item->>'taille',
      v_item->>'couleur',
      (v_item->>'prix_unitaire')::numeric,
      (v_item->>'quantite')::int,
      COALESCE((v_item->>'remise_ligne')::numeric, 0),
      (v_item->>'total')::numeric
    );

    v_variant_id := NULLIF(v_item->>'variant_id','')::uuid;
    v_qte := (v_item->>'quantite')::int;
    IF v_variant_id IS NOT NULL THEN
      UPDATE public.product_variants SET stock = stock - v_qte WHERE id = v_variant_id;
    END IF;
  END LOOP;

  RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sale_atomic(text, uuid, uuid, uuid, text, payment_method, jsonb, numeric, numeric, numeric, numeric, text, jsonb) TO authenticated;

-- =========================================================
-- 7. INDEX
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_session ON public.sales (session_id);
CREATE INDEX IF NOT EXISTS idx_sales_statut ON public.sales (statut);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_statut ON public.orders (statut);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_products_statut ON public.products (statut);
CREATE INDEX IF NOT EXISTS idx_products_categorie ON public.products (categorie_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_leads_traite ON public.chat_leads (traite, created_at DESC);