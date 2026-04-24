import { Link } from 'react-router-dom';
import type { SFProduct as Product } from '@/hooks/useStorefrontData';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/use-toast';

export default function ProductCard({ product }: { product: Product }) {
  const hasPromo = product.prix_promo !== null;
  const prix = hasPromo ? product.prix_promo! : product.prix_vente;
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const liked = has(product.id);

  const onLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggle(product.id);
    toast({ title: liked ? 'Retiré des favoris' : 'Ajouté aux favoris', description: product.nom });
  };

  return (
    <Link to={`/produit/${product.slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-3">
        <img
          src={product.images[0]}
          alt={`${product.nom} — ${product.tranche_age || 'enfant'} ${product.sexe || ''}`.trim()}
          loading="lazy"
          width={400}
          height={533}
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
          onClick={onLike}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${liked ? 'bg-primary text-primary-foreground opacity-100' : 'bg-background/80 text-foreground opacity-0 group-hover:opacity-100 hover:bg-background'}`}
          aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={liked}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
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
