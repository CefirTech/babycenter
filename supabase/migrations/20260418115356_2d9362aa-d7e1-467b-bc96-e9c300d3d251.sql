-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'vendeur');
CREATE TYPE public.order_status AS ENUM ('en_attente_paiement', 'payee', 'en_preparation', 'expediee', 'livree', 'annulee');
CREATE TYPE public.order_channel AS ENUM ('boutique', 'whatsapp', 'site', 'telephone');
CREATE TYPE public.payment_method AS ENUM ('especes', 'orange_money', 'moov_money', 'mtn_money', 'wave', 'carte', 'virement');
CREATE TYPE public.product_status AS ENUM ('actif', 'inactif', 'rupture');
CREATE TYPE public.expense_category AS ENUM ('loyer', 'fournisseurs', 'salaires', 'marketing', 'logistique', 'utilities', 'autre');
CREATE TYPE public.cash_movement_type AS ENUM ('entree', 'sortie');
CREATE TYPE public.promotion_type AS ENUM ('pourcentage', 'montant_fixe');

-- =========================================
-- TIMESTAMP TRIGGER FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'vendeur')
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  genre TEXT CHECK (genre IN ('fille', 'garcon', 'mixte')),
  tranche_age TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PRODUCTS
-- =========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_produit TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  categorie_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tranche_age TEXT,
  genre TEXT CHECK (genre IN ('fille', 'garcon', 'mixte')),
  marque TEXT,
  prix_achat NUMERIC(12,2) NOT NULL DEFAULT 0,
  prix_vente NUMERIC(12,2) NOT NULL DEFAULT 0,
  prix_promo NUMERIC(12,2),
  images TEXT[] NOT NULL DEFAULT '{}',
  statut public.product_status NOT NULL DEFAULT 'actif',
  est_nouveaute BOOLEAN NOT NULL DEFAULT false,
  est_meilleure_vente BOOLEAN NOT NULL DEFAULT false,
  matiere TEXT,
  entretien TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_categorie ON public.products(categorie_id);
CREATE INDEX idx_products_statut ON public.products(statut);

-- =========================================
-- PRODUCT VARIANTS
-- =========================================
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  taille TEXT,
  couleur TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  seuil_alerte INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_variants_product ON public.product_variants(product_id);

-- =========================================
-- CUSTOMERS
-- =========================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  ville TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ORDERS
-- =========================================
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_val INTEGER;
BEGIN
  next_val := nextval('public.order_number_seq');
  RETURN 'CMD-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::TEXT, 5, '0');
END;
$$;

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_commande TEXT NOT NULL UNIQUE DEFAULT public.generate_order_number(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_nom TEXT NOT NULL,
  customer_telephone TEXT,
  customer_adresse TEXT,
  canal public.order_channel NOT NULL DEFAULT 'site',
  statut public.order_status NOT NULL DEFAULT 'en_attente_paiement',
  mode_paiement public.payment_method,
  sous_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  frais_livraison NUMERIC(12,2) NOT NULL DEFAULT 0,
  remise NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_statut ON public.orders(statut);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_nom TEXT NOT NULL,
  taille TEXT,
  couleur TEXT,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- =========================================
-- SALES (POS)
-- =========================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_vente TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vendeur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendeur_nom TEXT,
  sous_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  remise NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  mode_paiement public.payment_method NOT NULL DEFAULT 'especes',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_created ON public.sales(created_at DESC);

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_nom TEXT NOT NULL,
  taille TEXT,
  couleur TEXT,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);

-- =========================================
-- EXPENSES
-- =========================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie public.expense_category NOT NULL,
  description TEXT NOT NULL,
  montant NUMERIC(12,2) NOT NULL,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement public.payment_method,
  justificatif_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_expenses_date ON public.expenses(date_depense DESC);

-- =========================================
-- CASH SESSIONS & MOVEMENTS
-- =========================================
CREATE TABLE public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ouverte_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ouverte_par_nom TEXT,
  fermee_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  solde_ouverture NUMERIC(12,2) NOT NULL DEFAULT 0,
  solde_theorique NUMERIC(12,2),
  solde_reel NUMERIC(12,2),
  ecart NUMERIC(12,2),
  notes TEXT,
  ouverte_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  fermee_le TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'fermee'))
);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  type public.cash_movement_type NOT NULL,
  montant NUMERIC(12,2) NOT NULL,
  motif TEXT NOT NULL,
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cash_movements_session ON public.cash_movements(session_id);

-- =========================================
-- PROMOTIONS
-- =========================================
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  type public.promotion_type NOT NULL,
  valeur NUMERIC(12,2) NOT NULL,
  montant_min_commande NUMERIC(12,2) DEFAULT 0,
  date_debut TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_fin TIMESTAMPTZ,
  utilisations_max INTEGER,
  utilisations INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_promotions_updated BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- SETTINGS
-- =========================================
CREATE TABLE public.settings (
  cle TEXT PRIMARY KEY,
  valeur JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ACTIVITY LOGS
-- =========================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_nom TEXT,
  action TEXT NOT NULL,
  ressource TEXT NOT NULL,
  ressource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_user ON public.activity_logs(user_id);

-- =========================================
-- RLS POLICIES
-- =========================================

-- profiles: users see/edit their own; staff sees all
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff views all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));

-- user_roles: only admin can manage; users can read their own
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- categories: public read, staff write
CREATE POLICY "Public reads categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Staff manages categories" ON public.categories FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- products: public reads active, staff manages
CREATE POLICY "Public reads active products" ON public.products FOR SELECT USING (statut = 'actif' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manages products" ON public.products FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff updates products" ON public.products FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff deletes products" ON public.products FOR DELETE USING (public.is_staff(auth.uid()));

-- product_variants: public reads, staff manages
CREATE POLICY "Public reads variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Staff manages variants" ON public.product_variants FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- customers: STAFF ONLY (sensitive PII)
CREATE POLICY "Staff manages customers" ON public.customers FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- orders: STAFF ONLY
CREATE POLICY "Staff manages orders" ON public.orders FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff manages order items" ON public.order_items FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- sales: staff only
CREATE POLICY "Staff manages sales" ON public.sales FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff manages sale items" ON public.sale_items FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- expenses: admin & manager only (more restrictive)
CREATE POLICY "Managers view expenses" ON public.expenses FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers manage expenses" ON public.expenses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers update expenses" ON public.expenses FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins delete expenses" ON public.expenses FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- cash sessions/movements: staff
CREATE POLICY "Staff manages cash sessions" ON public.cash_sessions FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff manages cash movements" ON public.cash_movements FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- promotions: public reads active, staff manages
CREATE POLICY "Public reads active promotions" ON public.promotions FOR SELECT USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manages promotions" ON public.promotions FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff updates promotions" ON public.promotions FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff deletes promotions" ON public.promotions FOR DELETE USING (public.is_staff(auth.uid()));

-- settings: public reads, admin only writes
CREATE POLICY "Public reads settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- activity_logs: staff reads, system inserts (via trigger or staff)
CREATE POLICY "Staff reads activity logs" ON public.activity_logs FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff inserts activity logs" ON public.activity_logs FOR INSERT WITH CHECK (public.is_staff(auth.uid()));