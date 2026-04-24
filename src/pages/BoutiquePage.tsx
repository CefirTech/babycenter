import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useAgeRanges } from '@/hooks/useAgeRanges';
import ProductCard from '@/components/storefront/ProductCard';
import ProductCardSkeleton from '@/components/storefront/ProductCardSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import SEO from '@/components/SEO';

const sexes = [
  { value: 'fille', label: 'Fille' },
  { value: 'garcon', label: 'Garçon' },
  { value: 'unisexe', label: 'Unisexe' },
];

const PER_PAGE = 24;

export default function BoutiquePage() {
  const { products, categories, loading } = useStorefrontData();
  const { ageRanges } = useAgeRanges();
  const [searchParams] = useSearchParams();
  const filtreParam = searchParams.get('filtre') || '';
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [sort, setSort] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Reset to first page when URL filter changes
  useEffect(() => { setPage(1); }, [filtreParam]);

  const allColors = useMemo(() => Array.from(new Set(products.flatMap(p => p.variants.map(v => v.couleur).filter(Boolean)))).sort(), [products]);
  const allSizes = useMemo(() => Array.from(new Set(products.flatMap(p => p.variants.map(v => v.taille).filter(Boolean)))).sort(), [products]);

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (p.statut !== 'actif') return false;
      if (filtreParam === 'nouveau' && !p.tags.includes('nouveau')) return false;
      if (filtreParam === 'promo' && !p.tags.includes('promo')) return false;
      if (filtreParam === 'bestseller' && !p.tags.includes('bestseller')) return false;
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.categorie_id !== catFilter) return false;
      if (ageFilter && p.tranche_age !== ageFilter) return false;
      if (sexeFilter && p.sexe !== sexeFilter) return false;
      if (colorFilter && !p.variants.some(v => v.couleur === colorFilter)) return false;
      if (sizeFilter && !p.variants.some(v => v.taille === sizeFilter)) return false;
      return true;
    });
    if (sort === 'price_asc') list = [...list].sort((a, b) => (a.prix_promo ?? a.prix_vente) - (b.prix_promo ?? b.prix_vente));
    else if (sort === 'price_desc') list = [...list].sort((a, b) => (b.prix_promo ?? b.prix_vente) - (a.prix_promo ?? a.prix_vente));
    return list;
  }, [products, filtreParam, search, catFilter, ageFilter, sexeFilter, colorFilter, sizeFilter, sort]);

  const hasFilters = catFilter || ageFilter || sexeFilter || colorFilter || sizeFilter;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="py-8 md:py-12">
      <SEO title="Boutique" description={`${products.length} articles enfants 0-16 ans en stock. Livraison rapide à Abidjan.`} />
      <div className="container">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Notre boutique</h1>
          <p className="text-muted-foreground mt-2">{filtered.length} article{filtered.length > 1 ? 's' : ''}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filtres
            {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filtres</h3>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setCatFilter(''); setAgeFilter(''); setSexeFilter(''); setColorFilter(''); setSizeFilter(''); setPage(1); }}>
                  <X className="h-4 w-4 mr-1" /> Réinitialiser
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <FilterGroup label="Catégorie" items={categories.map(c => ({ k: c.id, v: c.nom }))} value={catFilter} onChange={v => { setCatFilter(v); setPage(1); }} />
              <FilterGroup label="Âge" items={ageRanges.map(a => ({ k: a, v: a }))} value={ageFilter} onChange={v => { setAgeFilter(v); setPage(1); }} />
              <FilterGroup label="Genre" items={sexes.map(s => ({ k: s.value, v: s.label }))} value={sexeFilter} onChange={v => { setSexeFilter(v); setPage(1); }} />
              {allColors.length > 0 && <FilterGroup label="Couleur" items={allColors.map(c => ({ k: c, v: c }))} value={colorFilter} onChange={v => { setColorFilter(v); setPage(1); }} />}
              {allSizes.length > 0 && <FilterGroup label="Taille" items={allSizes.map(s => ({ k: s, v: s }))} value={sizeFilter} onChange={v => { setSizeFilter(v); setPage(1); }} />}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : visible.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {visible.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                <span className="text-sm text-muted-foreground px-3">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, items, value, onChange }: { label: string; items: { k: string; v: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map(it => (
          <button key={it.k} onClick={() => onChange(value === it.k ? '' : it.k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${value === it.k ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-foreground/70'}`}>
            {it.v}
          </button>
        ))}
      </div>
    </div>
  );
}
