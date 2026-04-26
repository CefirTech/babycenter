import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeroBanner {
  image_url: string;
  eyebrow: string;
  title_main: string;
  title_accent: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  show_whatsapp: boolean;
}

export const DEFAULT_HERO: HeroBanner = {
  image_url: '',
  eyebrow: 'Collection Printemps-Été 2025',
  title_main: "L'élégance pour vos",
  title_accent: 'petits trésors',
  subtitle: "Des vêtements raffinés qui grandissent avec vos enfants. Parce que chaque moment mérite le meilleur.",
  cta_label: 'Découvrir la collection',
  cta_href: '/boutique',
  show_whatsapp: true,
};

export function useHeroBanner() {
  const [hero, setHero] = useState<HeroBanner>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('settings').select('valeur').eq('cle', 'hero_banner').maybeSingle();
      if (!active) return;
      const raw: any = data?.valeur;
      const v = raw && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
      if (v && typeof v === 'object') setHero({ ...DEFAULT_HERO, ...v });
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel('hero-banner-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'cle=eq.hero_banner' }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  return { hero, loading };
}
