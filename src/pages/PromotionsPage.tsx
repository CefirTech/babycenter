import { useStorefrontData } from '@/hooks/useStorefrontData';
import ProductCard from '@/components/storefront/ProductCard';
import { useSEO } from '@/hooks/useSEO';

export default function PromotionsPage() {
  useSEO({
    title: 'Promotions — Vêtements enfants en solde | BABYCENTER',
    description: 'Profitez de nos promotions exceptionnelles sur les vêtements enfants : robes, t-shirts, ensembles à prix réduits.',
    canonical: 'https://babycenter.lovable.app/promotions',
  });
  const { products } = useStorefrontData();
  const promos = products.filter(p => p.prix_promo !== null && p.statut === 'actif');

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary">Promotions</h1>
          <p className="text-muted-foreground mt-2">Profitez de nos offres exceptionnelles — {promos.length} articles en promo</p>
        </div>
        {promos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {promos.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Aucune promotion en cours. Revenez bientôt !</p>
          </div>
        )}
      </div>
    </div>
  );
}
