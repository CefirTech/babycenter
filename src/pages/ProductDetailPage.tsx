import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/storefront/ProductCard';
import Reviews from '@/components/storefront/Reviews';
import SEO from '@/components/SEO';
import { ShoppingBag, MessageCircle, Heart, Truck, RotateCcw, ShieldCheck, ChevronLeft, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { products, loading } = useStorefrontData();
  const product = products.find(p => p.slug === slug);
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { push, ids: recentIds } = useRecentlyViewed();
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => { if (product) push(product.id); }, [product, push]);

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground text-lg">{loading ? 'Chargement...' : 'Produit non trouvé'}</p>
        {!loading && <Link to="/boutique"><Button variant="outline" className="mt-4">Retour à la boutique</Button></Link>}
      </div>
    );
  }

  if (!product.variants.length) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground text-lg">Ce produit n'a pas encore de variante disponible.</p>
        <Link to="/boutique"><Button variant="outline" className="mt-4">Retour à la boutique</Button></Link>
      </div>
    );
  }

  const variant = product.variants[selectedVariant];
  const prix = product.prix_promo ?? product.prix_vente;
  const similaires = products.filter(p => p.categorie_id === product.categorie_id && p.id !== product.id).slice(0, 4);
  const recents = products.filter(p => recentIds.includes(p.id) && p.id !== product.id).slice(0, 4);
  const liked = has(product.id);

  const handleAddToCart = () => {
    addItem(product, variant, qty);
    toast({ title: 'Ajouté au panier', description: `${product.nom} - ${variant.taille} / ${variant.couleur}` });
  };

  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/produit/${product.slug}` : '';
  const imageUrl = product.images[0] || '';
  const whatsappMsg = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par ${product.nom} (${variant.taille}, ${variant.couleur}) à ${prix.toLocaleString('fr-FR')} FCFA. Merci !` +
    (imageUrl ? `\n\n📷 ${imageUrl}` : '') + `\n🔗 ${productUrl}`
  );

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: product.nom, description: product.description_longue, image: product.images,
    sku: product.code_produit, brand: { '@type': 'Brand', name: product.marque || 'BABYCENTER' },
    offers: { '@type': 'Offer', priceCurrency: 'XOF', price: prix, availability: variant.statut === 'actif' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: productUrl },
  };

  return (
    <div className="py-6 md:py-10">
      <SEO title={product.nom} description={product.description_courte || product.description_longue.slice(0, 160)} type="product" image={product.images[0]} jsonLd={jsonLd} />
      <div className="container">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/boutique" className="flex items-center gap-1 hover:text-primary"><ChevronLeft className="h-4 w-4" /> Boutique</Link>
          <span>/</span>
          <span className="text-foreground">{product.nom}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary mb-3">
              <img src={product.images[selectedImage]} alt={product.nom} className="w-full h-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-primary' : 'border-border'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.marque && <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">{product.marque}</p>}
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">{product.nom}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-foreground">{prix.toLocaleString('fr-FR')} FCFA</span>
              {product.prix_promo && <span className="text-lg text-muted-foreground line-through">{product.prix_vente.toLocaleString('fr-FR')} FCFA</span>}
              {product.prix_promo && <span className="bg-primary/10 text-primary text-sm font-semibold px-2 py-0.5 rounded">-{Math.round((1 - product.prix_promo / product.prix_vente) * 100)}%</span>}
            </div>

            <p className="text-foreground/70 leading-relaxed mb-6">{product.description_longue}</p>

            <div className="mb-4">
              <label className="text-sm font-semibold text-foreground mb-2 block">Taille / Couleur</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const indispo = v.statut !== 'actif';
                  return (
                    <button key={v.id} onClick={() => !indispo && setSelectedVariant(i)} disabled={indispo}
                      className={`text-sm px-4 py-2 rounded-lg border transition-colors ${i === selectedVariant ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-foreground/80'} ${indispo ? 'opacity-40 line-through cursor-not-allowed' : ''}`}>
                      {v.taille} - {v.couleur}
                    </button>
                  );
                })}
              </div>
              <Link to="/guide-tailles" className="text-xs text-primary hover:underline mt-2 inline-block">Guide des tailles</Link>
            </div>

            <p className="text-sm mb-4">
              {variant.statut === 'actif' ? <span className="text-green-600 font-medium">✓ En stock</span> : <span className="text-destructive font-medium">Rupture de stock</span>}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-semibold text-foreground">Quantité</label>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="px-4 text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button size="lg" onClick={handleAddToCart} disabled={variant.statut !== 'actif'} className="flex-1 font-semibold">
                <ShoppingBag className="h-5 w-5 mr-2" /> Ajouter au panier
              </Button>
              <a href={`https://wa.me/2250151310606?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="lg" className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="h-5 w-5 mr-2" /> WhatsApp
                </Button>
              </a>
            </div>

            <button onClick={() => toggle(product.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
              <Heart className={`h-4 w-4 ${liked ? 'fill-primary text-primary' : ''}`} /> {liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>

            <div className="border-t border-border pt-6 space-y-3">
              {[
                { icon: Truck, text: 'Livraison 24-72h à Abidjan' },
                { icon: RotateCcw, text: 'Échanges et retours sous 7 jours' },
                { icon: ShieldCheck, text: 'Paiement 100% sécurisé' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground/70">
                  <Icon className="h-4 w-4 text-primary" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Reviews productId={product.id} />

        {similaires.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {similaires.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {recents.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Récemment consultés</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recents.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
