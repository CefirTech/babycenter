import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useWishlist() {
  const { user } = useAuth();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) { setProductIds([]); return; }
    setLoading(true);
    const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
    setProductIds((data ?? []).map(r => r.product_id));
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const isFavorite = (productId: string) => productIds.includes(productId);

  const toggle = async (productId: string) => {
    if (!user) { toast.error('Connectez-vous pour ajouter aux favoris'); return false; }
    if (isFavorite(productId)) {
      const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      if (error) { toast.error(error.message); return false; }
      setProductIds(ids => ids.filter(id => id !== productId));
      toast.success('Retiré des favoris');
    } else {
      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      if (error) { toast.error(error.message); return false; }
      setProductIds(ids => [...ids, productId]);
      toast.success('Ajouté aux favoris');
    }
    return true;
  };

  return { productIds, isFavorite, toggle, loading, reload };
}
