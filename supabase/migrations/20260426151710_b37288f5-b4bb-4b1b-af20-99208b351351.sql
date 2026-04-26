CREATE OR REPLACE FUNCTION public.create_public_order(
  _customer_nom text,
  _customer_telephone text,
  _customer_adresse text,
  _mode_paiement payment_method,
  _sous_total numeric,
  _total numeric,
  _notes text,
  _user_id uuid,
  _items jsonb,
  _promo_code text DEFAULT NULL,
  _remise numeric DEFAULT 0
)
RETURNS TABLE(id uuid, numero_commande text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_numero text;
  v_item jsonb;
BEGIN
  IF char_length(coalesce(_customer_nom,'')) < 2 OR char_length(_customer_nom) > 120 THEN
    RAISE EXCEPTION 'Nom invalide';
  END IF;
  IF char_length(coalesce(_customer_telephone,'')) < 6 OR char_length(_customer_telephone) > 30 THEN
    RAISE EXCEPTION 'Téléphone invalide';
  END IF;
  IF _total < 0 OR _sous_total < 0 OR _remise < 0 THEN
    RAISE EXCEPTION 'Montants invalides';
  END IF;

  INSERT INTO public.orders (
    customer_nom, customer_telephone, customer_adresse,
    canal, mode_paiement, sous_total, remise, total, notes, user_id, statut
  ) VALUES (
    _customer_nom, _customer_telephone, _customer_adresse,
    'site', _mode_paiement, _sous_total, _remise, _total, _notes, _user_id, 'en_attente_paiement'
  )
  RETURNING orders.id, orders.numero_commande INTO v_order_id, v_numero;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_nom, taille, couleur,
      prix_unitaire, quantite, total
    ) VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id','')::uuid,
      NULLIF(v_item->>'variant_id','')::uuid,
      v_item->>'product_nom',
      v_item->>'taille',
      v_item->>'couleur',
      (v_item->>'prix_unitaire')::numeric,
      (v_item->>'quantite')::int,
      (v_item->>'total')::numeric
    );
  END LOOP;

  IF _promo_code IS NOT NULL AND char_length(_promo_code) > 0 THEN
    UPDATE public.promotions
       SET utilisations = utilisations + 1
     WHERE upper(code) = upper(_promo_code) AND active = true;
  END IF;

  RETURN QUERY SELECT v_order_id, v_numero;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_order(text, text, text, payment_method, numeric, numeric, text, uuid, jsonb, text, numeric) TO anon, authenticated;