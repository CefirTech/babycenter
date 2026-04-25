import { Link } from 'react-router-dom';
import type { SFProduct as Product } from '@/hooks/useStorefrontData';
import { Heart } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const hasPromo = product.prix_promo !== null;
  const prix = hasPromo ? product.prix_promo! : product.prix_vente;

  return (
    <Link to={`/produit/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-3">
        <img
          src={product.images[0]}
          alt={product.nom}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasPromo && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
            -{Math.round((1 - product.prix_promo! / product.prix_vente) * 100)}%
          </span>
        )}
        {product.tags.includes('nouveau') && !hasPromo && (
          <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
            Nouveau
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-background"
          aria-label="Ajouter aux favoris"
        >
          <Heart className="h-4 w-4 text-foreground" />
        </button>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.marque || product.tranche_age}</p>
        <h3 className="font-medium text-sm md:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.nom}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{prix.toLocaleString('fr-FR')} FCFA</span>
          {hasPromo && (
            <span className="text-sm text-muted-foreground line-through">{product.prix_vente.toLocaleString('fr-FR')} FCFA</span>
          )}
        </div>
      </div>
    </Link>
  );
}
