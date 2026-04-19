import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const FALLBACK_AGE_RANGES = [
  '0-3 mois',
  '3-6 mois',
  '6-12 mois',
  '1-2 ans',
  '2-4 ans',
  '4-6 ans',
  '6-8 ans',
  '8-10 ans',
  '10-12 ans',
  '12-14 ans',
  '14-16 ans',
];

const normalizeAgeRanges = (value: unknown) => {
  if (!Array.isArray(value)) return FALLBACK_AGE_RANGES;

  const cleaned = Array.from(
    new Set(
      value
        .map((item) => String(item).trim())
        .filter(Boolean),
    ),
  );

  return cleaned.length > 0 ? cleaned : FALLBACK_AGE_RANGES;
};

const extractAgeRanges = (value: unknown) => {
  if (value && typeof value === 'object' && 'v' in value) {
    return normalizeAgeRanges((value as { v?: unknown }).v);
  }

  return normalizeAgeRanges(value);
};

export function useAgeRanges() {
  const [ageRanges, setAgeRanges] = useState<string[]>(FALLBACK_AGE_RANGES);
  const [loading, setLoading] = useState(true);

  const load = async (withLoader = true) => {
    if (withLoader) setLoading(true);

    const { data, error } = await supabase
      .from('settings')
      .select('cle, valeur')
      .eq('cle', 'age_ranges')
      .maybeSingle();

    if (!error) {
      setAgeRanges(extractAgeRanges(data?.valeur));
    }

    if (withLoader) setLoading(false);
  };

  useEffect(() => {
    load();

    const handleRefresh = () => {
      load(false);
    };

    const channel = supabase
      .channel('settings-age-ranges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
        const nextKey = (payload.new as { cle?: string } | null)?.cle;
        const prevKey = (payload.old as { cle?: string } | null)?.cle;

        if (nextKey === 'age_ranges' || prevKey === 'age_ranges') {
          load(false);
        }
      })
      .subscribe();

    window.addEventListener('age-ranges:refresh', handleRefresh);

    const poller = window.setInterval(() => {
      load(false);
    }, 20000);

    return () => {
      window.removeEventListener('age-ranges:refresh', handleRefresh);
      window.clearInterval(poller);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ageRanges,
    loading,
    reloadAgeRanges: () => load(false),
  };
}