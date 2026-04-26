import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { SFProduct as Product } from '@/hooks/useStorefrontData';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { getStockUrgency } from '@/lib/stock-urgency';
import StockProgress from '@/components/storefront/StockProgress';

export default function ProductCard({ product }: { product: Product }) {
  const hasPromo = product.prix_promo !== null;
  const prix = hasPromo ? product.prix_promo! : product.prix_vente;
  const { isFavorite, toggle } = useWishlist();
  const fav = isFavorite(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link to={`/produit/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-3 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
          <motion.img
            src={product.images[0]}
            alt={product.nom}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {hasPromo && (
            <motion.span
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
              className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-md"
            >
              -{Math.round((1 - product.prix_promo! / product.prix_vente) * 100)}%
            </motion.span>
          )}
          {product.tags.includes('nouveau') && !hasPromo && (
            <motion.span
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
              className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-md"
            >
              Nouveau
            </motion.span>
          )}
          <motion.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background shadow-sm",
              fav ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={cn("h-4 w-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
          </motion.button>
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
          <div className="pt-1">
            <StockProgress urgency={getStockUrgency(product)} size="sm" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
