-- ============================================
-- PHASE 3 : INTÉGRITÉ BASE DE DONNÉES (idempotent)
-- ============================================

-- 1) FOREIGN KEYS manquantes (ajout conditionnel)
DO $$
BEGIN
  -- categories self-ref
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fkey') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- orders.customer
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;

  -- products.categorie
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_categorie_id_fkey') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_categorie_id_fkey
      FOREIGN KEY (categorie_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- sales.customer + session
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_customer_id_fkey') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_session_id_fkey') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE SET NULL;
  END IF;

  -- cash_movements.session
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_movements_session_id_fkey') THEN
    ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;
  END IF;

  -- wishlists.product
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlists_product_id_fkey') THEN
    ALTER TABLE public.wishlists ADD CONSTRAINT wishlists_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2) TRIGGERS updated_at (idempotents via DROP IF EXISTS)
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON public.promotions;
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) CHECK CONSTRAINTS (ajout conditionnel)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_prix_achat_positif') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_prix_achat_positif CHECK (prix_achat >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_prix_vente_positif') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_prix_vente_positif CHECK (prix_vente >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_prix_promo_positif') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_prix_promo_positif CHECK (prix_promo IS NULL OR prix_promo >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_stock_positif') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_stock_positif CHECK (stock >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_seuil_positif') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_seuil_positif CHECK (seuil_alerte >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_quantite_positif') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantite_positif CHECK (quantite > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_prix_positif') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_prix_positif CHECK (prix_unitaire >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_total_positif') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_total_positif CHECK (total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_quantite_positif') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_quantite_positif CHECK (quantite > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_prix_positif') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_prix_positif CHECK (prix_unitaire >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_total_positif') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_total_positif CHECK (total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_remise_positif') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_remise_positif CHECK (remise_ligne >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_total_positif') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_total_positif CHECK (total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_sous_total_positif') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_sous_total_positif CHECK (sous_total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_remise_positif') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_remise_positif CHECK (remise >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_livraison_positif') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_livraison_positif CHECK (frais_livraison >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_total_positif') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_total_positif CHECK (total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_sous_total_positif') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_sous_total_positif CHECK (sous_total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_remise_positif') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_remise_positif CHECK (remise >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_montant_positif') THEN
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_montant_positif CHECK (montant >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_note_valide') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_note_valide CHECK (note BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_valeur_positif') THEN
    ALTER TABLE public.promotions ADD CONSTRAINT promotions_valeur_positif CHECK (valeur >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_utilisations_positif') THEN
    ALTER TABLE public.promotions ADD CONSTRAINT promotions_utilisations_positif CHECK (utilisations >= 0);
  END IF;
END $$;

-- 4) INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_statut ON public.products(statut);
CREATE INDEX IF NOT EXISTS idx_products_categorie ON public.products(categorie_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_statut ON public.orders(statut);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_session ON public.sales(session_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_statut ON public.sales(statut);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON public.cash_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_statut ON public.categories(statut);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approuve ON public.reviews(approuve);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date_depense DESC);