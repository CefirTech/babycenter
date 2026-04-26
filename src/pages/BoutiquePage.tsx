import { useState, useMemo } from 'react';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useAgeRanges } from '@/hooks/useAgeRanges';
import { useSEO } from '@/hooks/useSEO';
import ProductCard from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, X } from 'lucide-react';
const sexes = [
  { value: 'fille', label: 'Fille' },
  { value: 'garcon', label: 'Garçon' },
  { value: 'unisexe', label: 'Unisexe' },
];

export default function BoutiquePage() {
  const { products, categories, loading } = useStorefrontData();
  const { ageRanges } = useAgeRanges();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const itemListJsonLd = useMemo(() => ({
    '@context': 'https://schema.org/',
    '@type': 'ItemList',
    name: 'Boutique BABYCENTER',
    numberOfItems: products.filter(p => p.statut === 'actif').length,
    itemListElement: products.filter(p => p.statut === 'actif').slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://babycenter.lovable.app/produit/${p.slug}`,
      name: p.nom,
    })),
  }), [products]);

  useSEO({
    title: 'Boutique — Tous nos vêtements enfants | BABYCENTER',
    description: 'Découvrez notre collection complète : robes, t-shirts, ensembles pour filles et garçons de 0 à 16 ans. Filtrez par âge, catégorie et genre.',
    canonical: 'https://babycenter.lovable.app/boutique',
    jsonLd: itemListJsonLd,
  });
  const { ageRanges } = useAgeRanges();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (p.statut !== 'actif') return false;
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.categorie_id !== catFilter) return false;
      if (ageFilter && p.tranche_age !== ageFilter) return false;
      if (sexeFilter && p.sexe !== sexeFilter) return false;
      return true;
    });
  }, [products, search, catFilter, ageFilter, sexeFilter]);

  const hasFilters = catFilter || ageFilter || sexeFilter;

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Notre boutique</h1>
          <p className="text-muted-foreground mt-2">{filtered.length} articles disponibles</p>
        </div>

        {/* Search + filter toggle */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filtres
            {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filtres</h3>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setCatFilter(''); setAgeFilter(''); setSexeFilter(''); }}>
                  <X className="h-4 w-4 mr-1" /> Réinitialiser
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Catégorie</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setCatFilter(catFilter === c.id ? '' : c.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${catFilter === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-foreground/70'}`}>
                      {c.nom}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Âge</label>
                <div className="flex flex-wrap gap-2">
                  {ageRanges.map(a => (
                    <button key={a} onClick={() => setAgeFilter(ageFilter === a ? '' : a)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${ageFilter === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-foreground/70'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Genre</label>
                <div className="flex flex-wrap gap-2">
                  {sexes.map(s => (
                    <button key={s.value} onClick={() => setSexeFilter(sexeFilter === s.value ? '' : s.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sexeFilter === s.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-foreground/70'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Aucun produit trouvé</p>
            <p className="text-muted-foreground text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>
    </div>
  );
}
