import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useAgeRanges } from '@/hooks/useAgeRanges';
import { useSEO } from '@/hooks/useSEO';
import ProductCard from '@/components/storefront/ProductCard';
import ProductGridSkeleton from '@/components/storefront/ProductGridSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';

const SEXES = [
  { value: 'fille', label: 'Fille' },
  { value: 'garcon', label: 'Garçon' },
  { value: 'unisexe', label: 'Unisexe' },
];

const SORTS = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
  { value: 'promo', label: 'Promotions' },
  { value: 'nouveaute', label: 'Nouveautés' },
];

type SortKey = 'recent' | 'prix_asc' | 'prix_desc' | 'promo' | 'nouveaute';

export default function BoutiquePage() {
  const { products, categories, loading } = useStorefrontData();
  const { ageRanges } = useAgeRanges();
  const [params, setParams] = useSearchParams();

  const search = params.get('q') ?? '';
  const catFilter = params.get('cat') ?? '';
  const ageFilter = params.get('age') ?? '';
  const sexeFilter = params.get('sexe') ?? '';
  const sortKey = (params.get('tri') ?? 'recent') as SortKey;
  const showFilters = params.get('filtres') === '1';

  const setParam = useCallback((key: string, value: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }, [setParams]);

  const toggleFilters = () => setParam('filtres', showFilters ? '' : '1');

  const resetFilters = () => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('cat'); next.delete('age'); next.delete('sexe'); next.delete('q');
      return next;
    }, { replace: true });
  };

  const hasFilters = !!(catFilter || ageFilter || sexeFilter || search);

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (p.statut !== 'actif') return false;
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.marque.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.categorie_id !== catFilter) return false;
      if (ageFilter && p.tranche_age !== ageFilter) return false;
      if (sexeFilter && p.sexe !== sexeFilter) return false;
      return true;
    });

    switch (sortKey) {
      case 'prix_asc': list = [...list].sort((a, b) => (a.prix_promo ?? a.prix_vente) - (b.prix_promo ?? b.prix_vente)); break;
      case 'prix_desc': list = [...list].sort((a, b) => (b.prix_promo ?? b.prix_vente) - (a.prix_promo ?? a.prix_vente)); break;
      case 'promo': list = [...list].sort((a, b) => (b.prix_promo ? 1 : 0) - (a.prix_promo ? 1 : 0)); break;
      case 'nouveaute': list = [...list].sort((a, b) => (b.tags.includes('nouveau') ? 1 : 0) - (a.tags.includes('nouveau') ? 1 : 0)); break;
      default: break; // 'recent' — already ordered by created_at desc from API
    }
    return list;
  }, [products, search, catFilter, ageFilter, sexeFilter, sortKey]);

  const itemListJsonLd = useMemo(() => ({
    '@context': 'https://schema.org/',
    '@type': 'ItemList',
    name: 'Boutique BABYCENTER',
    numberOfItems: filtered.length,
    itemListElement: filtered.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem', position: i + 1,
      url: `https://babycenter.lovable.app/produit/${p.slug}`, name: p.nom,
    })),
  }), [filtered]);

  useSEO({
    title: 'Boutique — Tous nos vêtements enfants | BABYCENTER',
    description: 'Découvrez notre collection complète : robes, t-shirts, ensembles pour filles et garçons de 0 à 16 ans.',
    canonical: 'https://babycenter.lovable.app/boutique',
    jsonLd: itemListJsonLd,
  });

  const chipClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
        : 'border-border text-foreground/70 hover:border-primary hover:text-primary bg-background'
    }`;

  return (
    <div className="relative py-8 md:py-12 overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div aria-hidden className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div aria-hidden className="absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/8 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="container">
        {/* Page header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <motion.span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Sparkles className="h-3.5 w-3.5" /> Collection
          </motion.span>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground leading-tight">
            Notre{' '}
            <motion.span className="text-primary italic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              boutique
            </motion.span>
          </h1>
          <motion.p className="text-muted-foreground mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <AnimatePresence mode="wait">
              <motion.span key={filtered.length} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }} className="inline-block font-semibold text-foreground">
                {loading ? '…' : filtered.length}
              </motion.span>
            </AnimatePresence>
            {' '}articles disponibles
          </motion.p>
        </motion.div>

        {/* Search bar + controls row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit, une marque…"
              value={search}
              onChange={e => setParam('q', e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortKey} onValueChange={v => setParam('tri', v)}>
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={toggleFilters} className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtres</span>
              {hasFilters && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div className="flex flex-wrap gap-2 mb-4"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {search && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  "{search}"
                  <button onClick={() => setParam('q', '')} className="ml-0.5 hover:text-primary/60"><X className="h-3 w-3" /></button>
                </span>
              )}
              {catFilter && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {categories.find(c => c.id === catFilter)?.nom ?? catFilter}
                  <button onClick={() => setParam('cat', '')} className="ml-0.5 hover:text-primary/60"><X className="h-3 w-3" /></button>
                </span>
              )}
              {ageFilter && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {ageFilter}
                  <button onClick={() => setParam('age', '')} className="ml-0.5 hover:text-primary/60"><X className="h-3 w-3" /></button>
                </span>
              )}
              {sexeFilter && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {SEXES.find(s => s.value === sexeFilter)?.label ?? sexeFilter}
                  <button onClick={() => setParam('sexe', '')} className="ml-0.5 hover:text-primary/60"><X className="h-3 w-3" /></button>
                </span>
              )}
              <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Tout effacer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Filtres</h3>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      <X className="h-4 w-4 mr-1" /> Réinitialiser
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Catégorie</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <button key={c.id} onClick={() => setParam('cat', catFilter === c.id ? '' : c.id)}
                          className={chipClass(catFilter === c.id)}>
                          {c.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Tranche d'âge</p>
                    <div className="flex flex-wrap gap-2">
                      {ageRanges.map(a => (
                        <button key={a} onClick={() => setParam('age', ageFilter === a ? '' : a)}
                          className={chipClass(ageFilter === a)}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Genre</p>
                    <div className="flex flex-wrap gap-2">
                      {SEXES.map(s => (
                        <button key={s.value} onClick={() => setParam('sexe', sexeFilter === s.value ? '' : s.value)}
                          className={chipClass(sexeFilter === s.value)}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product grid */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div key={p.id} layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.5), ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div className="text-center py-24" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-muted-foreground text-lg font-medium">Aucun produit trouvé</p>
            <p className="text-muted-foreground text-sm mt-1 mb-6">Essayez de modifier vos filtres</p>
            <Button variant="outline" onClick={resetFilters}>Effacer les filtres</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
