import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { SFProduct as Product } from '@/hooks/useStorefrontData';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { getStockUrgency } from '@/lib/stock-urgency';
import StockProgress from '@/components/storefront/StockProgress';
import FlashSaleBanner from '@/components/storefront/FlashSaleBanner';
import { useFlashSale } from '@/hooks/useFlashSale';
import { toast } from 'sonner';

export default function ProductCard({ product }: { product: Product }) {
  const { flashSale } = useFlashSale(product.id);
  const hasPromo = product.prix_promo !== null;
  const prix = hasPromo ? product.prix_promo! : product.prix_vente;
  const { isFavorite, toggle } = useWishlist();
  const { addItem } = useCart();
  const fav = isFavorite(product.id);
  const [added, setAdded] = useState(false);

  const firstActiveVariant = product.variants.find(v => v.statut === 'actif') ?? product.variants[0];
  const hasVariants = product.variants.length > 1;
  const canQuickAdd = firstActiveVariant && !hasVariants;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstActiveVariant) return;
    addItem(product, firstActiveVariant, 1);
    setAdded(true);
    toast.success(`${product.nom} ajouté au panier`, { duration: 2000 });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="group">
        <Link to={`/produit/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary mb-3 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
            {/* Image */}
            <motion.img
              src={product.images[0]}
              alt={product.nom}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Badges */}
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

            {/* Wishlist button */}
            <motion.button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300",
                fav ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={cn("h-4 w-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
            </motion.button>

            {/* Quick add button — slides up from bottom on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
              {canQuickAdd ? (
                <motion.button
                  onClick={handleQuickAdd}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg",
                    added
                      ? "bg-green-500 text-white"
                      : "bg-white text-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {added ? (
                      <motion.span key="check" className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.2 }}>
                        <Check className="h-4 w-4" /> Ajouté !
                      </motion.span>
                    ) : (
                      <motion.span key="add" className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.2 }}>
                        <ShoppingBag className="h-4 w-4" /> Ajouter au panier
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              ) : (
                <Link
                  to={`/produit/${product.slug}`}
                  onClick={e => e.stopPropagation()}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-white text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-lg"
                >
                  <ShoppingBag className="h-4 w-4" /> Choisir les options
                </Link>
              )}
            </div>
          </div>
        </Link>

        {/* Info */}
        <div className="space-y-1 px-0.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.marque || product.tranche_age}</p>
          <Link to={`/produit/${product.slug}`}>
            <h3 className="font-medium text-sm md:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {product.nom}
            </h3>
          </Link>
          {flashSale ? (
            <FlashSaleBanner flashSale={flashSale} prixOriginal={product.prix_vente} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{prix.toLocaleString('fr-FR')} FCFA</span>
                {hasPromo && (
                  <span className="text-xs text-muted-foreground line-through">{product.prix_vente.toLocaleString('fr-FR')} F</span>
                )}
              </div>
              <div className="pt-0.5">
                <StockProgress urgency={getStockUrgency(product)} size="sm" />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
