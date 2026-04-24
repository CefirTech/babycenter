-- Wishlist
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  auteur_nom text NOT NULL,
  note int NOT NULL CHECK (note BETWEEN 1 AND 5),
  titre text,
  commentaire text NOT NULL,
  approuve boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads approved reviews" ON public.reviews
  FOR SELECT USING (approuve = true);
CREATE POLICY "Users insert own review" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff manages reviews" ON public.reviews
  FOR ALL USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE INDEX idx_reviews_product ON public.reviews(product_id) WHERE approuve = true;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Newsletter
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed boolean NOT NULL DEFAULT false
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public subscribes" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff reads subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff manages subscribers" ON public.newsletter_subscribers
  FOR UPDATE USING (is_staff(auth.uid()));

-- Recently viewed (server side optional, mainly client localStorage)
-- We add link orders.user_id so connected users see their orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users read own order items" ON public.order_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Public creates orders" ON public.orders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public creates order items" ON public.order_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));