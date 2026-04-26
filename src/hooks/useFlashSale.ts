import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FlashSale {
  id: string;
  product_id: string;
  titre: string;
  prix_flash: number;
  date_debut: string;
  date_fin: string;
  stock_initial: number;
  stock_vendu: number;
  active: boolean;
}

/** Subscribe to the currently active flash sale (if any) for a given product. */
export function useFlashSale(productId: string | undefined) {
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    let active = true;

    const load = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
        .lte('date_debut', nowIso)
        .gte('date_fin', nowIso)
        .order('date_debut', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      setFlashSale((data as FlashSale | null) ?? null);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`flash-sale-${productId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'flash_sales', filter: `product_id=eq.${productId}` },
        () => load())
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [productId]);

  return { flashSale, loading };
}

/** Build a stable countdown string from now until target. */
export function formatCountdown(target: Date | string): string {
  const t = typeof target === 'string' ? new Date(target) : target;
  const diff = Math.max(0, t.getTime() - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
}
