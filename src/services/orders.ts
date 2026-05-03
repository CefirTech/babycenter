import { supabase } from '@/integrations/supabase/client';

export interface CreateOrderPayload {
  customer_nom: string;
  customer_telephone: string;
  customer_adresse: string;
  mode_paiement: string;
  sous_total: number;
  total: number;
  notes?: string | null;
  user_id?: string | null;
  items: {
    product_id: string;
    variant_id: string;
    product_nom: string;
    taille?: string | null;
    couleur?: string | null;
    prix_unitaire: number;
    quantite: number;
    total: number;
  }[];
  promo_code?: string | null;
  remise?: number;
}

export async function createPublicOrder(payload: CreateOrderPayload) {
  const { data, error } = await supabase.rpc('create_public_order', {
    _customer_nom: payload.customer_nom,
    _customer_telephone: payload.customer_telephone,
    _customer_adresse: payload.customer_adresse,
    _mode_paiement: payload.mode_paiement,
    _sous_total: payload.sous_total,
    _total: payload.total,
    _notes: payload.notes ?? null,
    _user_id: payload.user_id ?? null,
    _items: payload.items,
    _promo_code: payload.promo_code ?? null,
    _remise: payload.remise ?? 0,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as { numero_commande: string; order_id: string };
}

export async function validatePromoCode(code: string, montant: number) {
  const { data, error } = await supabase.rpc('validate_promo_code', {
    _code: code,
    _montant: montant,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as {
    valid: boolean;
    reason?: string;
    code: string;
    nom: string;
    type: 'pourcentage' | 'montant_fixe';
    valeur: number;
  };
}

export async function fetchUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
