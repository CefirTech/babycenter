-- Restreindre les policies trop permissives
DROP POLICY IF EXISTS "Public creates orders" ON public.orders;
DROP POLICY IF EXISTS "Public creates order items" ON public.order_items;
DROP POLICY IF EXISTS "Public subscribes" ON public.newsletter_subscribers;

-- Orders: limiter les colonnes côté client n'est pas faisable en RLS, on laisse l'insert public mais sans staff side_effects
CREATE POLICY "Anyone creates orders" ON public.orders
  FOR INSERT WITH CHECK (
    canal = 'site'
    AND statut = 'en_attente_paiement'
    AND char_length(customer_nom) BETWEEN 2 AND 120
    AND char_length(customer_telephone) BETWEEN 6 AND 30
    AND total >= 0
  );
CREATE POLICY "Anyone creates order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.statut = 'en_attente_paiement')
    AND quantite > 0 AND prix_unitaire >= 0 AND total >= 0
  );

-- Newsletter
CREATE POLICY "Anyone subscribes newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND unsubscribed = false
  );

-- Frais de livraison setting (whitelist already includes 'shipping')
INSERT INTO public.settings (cle, valeur, description)
VALUES (
  'shipping',
  '{"abidjan": 1500, "interieur": 3000, "free_threshold": 50000}'::jsonb,
  'Frais de livraison par zone et seuil livraison gratuite'
)
ON CONFLICT (cle) DO NOTHING;