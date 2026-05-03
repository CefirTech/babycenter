import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchStorefrontData } from '@/services/storefront';

// Re-export types from service so existing imports keep working
export type { SFVariant, SFProduct, SFCategory } from '@/services/storefront';

export function useStorefrontData() {
  const [products, setProducts] = useState<import('@/services/storefront').SFProduct[]>([]);
  const [categories, setCategories] = useState<import('@/services/storefront').SFCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const result = await fetchStorefrontData();
    setProducts(result.products);
    setCategories(result.categories);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('storefront-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products, categories, loading, reload: load };
}
