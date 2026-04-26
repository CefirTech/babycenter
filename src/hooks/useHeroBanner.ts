import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeroSlide {
  image_url: string;
  eyebrow: string;
  title_main: string;
  title_accent: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  show_whatsapp: boolean;
  show_take_button?: boolean;
  take_button_label?: string;
  take_button_href?: string;
}

export interface HeroConfig {
  slides: HeroSlide[];
  interval_seconds: number; // 3-15
}

// Backward-compat alias
export type HeroBanner = HeroSlide;

export const DEFAULT_SLIDE: HeroSlide = {
  image_url: '',
  eyebrow: 'Collection Printemps-Été 2025',
  title_main: "L'élégance pour vos",
  title_accent: 'petits trésors',
  subtitle: "Des vêtements raffinés qui grandissent avec vos enfants. Parce que chaque moment mérite le meilleur.",
  cta_label: 'Découvrir la collection',
  cta_href: '/boutique',
  show_whatsapp: true,
};

export const DEFAULT_HERO: HeroSlide = DEFAULT_SLIDE;

export const DEFAULT_CONFIG: HeroConfig = {
  slides: [DEFAULT_SLIDE],
  interval_seconds: 6,
};

const clampInterval = (n: any) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 6;
  return Math.min(15, Math.max(3, Math.round(v)));
};

function normalize(raw: any): HeroConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;
  // New shape: { slides, interval_seconds }
  if (Array.isArray(raw.slides)) {
    const slides = raw.slides
      .filter((s: any) => s && typeof s === 'object')
      .map((s: any) => ({ ...DEFAULT_SLIDE, ...s }));
    return {
      slides: slides.length ? slides : [DEFAULT_SLIDE],
      interval_seconds: clampInterval(raw.interval_seconds ?? 6),
    };
  }
  // Legacy shape: single slide object
  return { slides: [{ ...DEFAULT_SLIDE, ...raw }], interval_seconds: 6 };
}

export function useHeroBanner() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('settings').select('valeur').eq('cle', 'hero_banner').maybeSingle();
      if (!active) return;
      const raw: any = data?.valeur;
      const v = raw && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
      setConfig(normalize(v));
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel('hero-banner-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'cle=eq.hero_banner' }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  // Backward-compat: expose first slide as `hero`
  return { config, hero: config.slides[0] ?? DEFAULT_SLIDE, loading };
}
