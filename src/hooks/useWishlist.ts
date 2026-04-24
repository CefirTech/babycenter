import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LS_KEY = 'babycenter_wishlist';

function readLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function writeLocal(ids: string[]) { localStorage.setItem(LS_KEY, JSON.stringify(ids)); }

export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
      if (error) console.error('wishlist load', error);
      const local = new Set(readLocal());
      const remote = new Set((data ?? []).map(r => r.product_id));
      // merge local into remote on first login
      const toInsert = [...local].filter(id => !remote.has(id));
      if (toInsert.length > 0) {
        await supabase.from('wishlists').insert(toInsert.map(product_id => ({ user_id: user.id, product_id })));
        toInsert.forEach(id => remote.add(id));
        writeLocal([]);
      }
      setIds(remote);
    } else {
      setIds(new Set(readLocal()));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (productId: string) => {
    const next = new Set(ids);
    const has = next.has(productId);
    if (has) next.delete(productId); else next.add(productId);
    setIds(next);
    if (user) {
      if (has) await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      else await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    } else {
      writeLocal([...next]);
    }
  };

  return { ids, has: (id: string) => ids.has(id), toggle, loading, count: ids.size };
}
