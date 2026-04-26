import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useSEO } from '@/hooks/useSEO';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/storefront/ProductCard';
import { ShoppingBag, MessageCircle, Heart, Truck, RotateCcw, ShieldCheck, ChevronLeft, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStockUrgency } from '@/lib/stock-urgency';
import StockProgress from '@/components/storefront/StockProgress';

const SITE = 'https://babycenter.lovable.app';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { products, categories, loading } = useStorefrontData();
  const product = products.find(p => p.slug === slug);
  const category = categories.find(c => c.id === product?.categorie_id);
  const prixSEO = product ? (product.prix_promo ?? product.prix_vente) : 0;
  const stockTotal = product?.variants.reduce((s, v) => s + (v.stock || 0), 0) ?? 0;
  const productJsonLd = product ? {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.nom,
    description: product.description_longue || product.description_courte || product.nom,
    image: product.images && product.images.length ? product.images : undefined,
    sku: product.code_produit,
    brand: product.marque ? { '@type': 'Brand', name: product.marque } : { '@type': 'Brand', name: 'BABYCENTER' },
    category: category?.nom,
    offers: {
      '@type': 'Offer',
      url: `${SITE}/produit/${product.slug}`,
      priceCurrency: 'XOF',
      price: prixSEO,
      availability: stockTotal > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  } : null;
  const breadcrumbJsonLd = product ? {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${SITE}/boutique` },
      ...(category ? [{ '@type': 'ListItem', position: 3, name: category.nom, item: `${SITE}/boutique?cat=${category.slug}` }] : []),
      { '@type': 'ListItem', position: category ? 4 : 3, name: product.nom, item: `${SITE}/produit/${product.slug}` },
    ],
  } : null;
  useSEO({
    title: product ? `${product.nom} — ${prixSEO.toLocaleString('fr-FR')} FCFA | BABYCENTER` : 'Produit | BABYCENTER',
    description: product?.description_courte || `Achetez ${product?.nom ?? 'ce produit'} sur BABYCENTER. Livraison rapide à Abidjan.`,
    canonical: product ? `${SITE}/produit/${product.slug}` : undefined,
    image: product?.images?.[0],
    ogType: 'product',
    jsonLd: productJsonLd && breadcrumbJsonLd ? [productJsonLd, breadcrumbJsonLd] : undefined,
  });
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

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

  const handleAddToCart = () => {
    addItem(product, variant, qty);
    toast({ title: 'Ajouté au panier', description: `${product.nom} - ${variant.taille} / ${variant.couleur}` });
  };

  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/produit/${product.slug}` : '';
  const imageUrl = product.images[0] || '';
  const whatsappMsg = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par ${product.nom} (${variant.taille}, ${variant.couleur}) à ${prix.toLocaleString('fr-FR')} FCFA. Merci !` +
    (imageUrl ? `\n\n📷 ${imageUrl}` : '') +
    `\n🔗 ${productUrl}`
  );

  return (
    <div className="py-6 md:py-10">
      <div className="container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/boutique" className="flex items-center gap-1 hover:text-primary"><ChevronLeft className="h-4 w-4" /> Boutique</Link>
          <span>/</span>
          <span className="text-foreground">{product.nom}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
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

          {/* Info */}
          <div className="flex flex-col">
            {product.marque && <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">{product.marque}</p>}
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">{product.nom}</h1>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-foreground">{prix.toLocaleString('fr-FR')} FCFA</span>
              {product.prix_promo && (
                <span className="text-lg text-muted-foreground line-through">{product.prix_vente.toLocaleString('fr-FR')} FCFA</span>
              )}
              {product.prix_promo && (
                <span className="bg-primary/10 text-primary text-sm font-semibold px-2 py-0.5 rounded">
                  -{Math.round((1 - product.prix_promo / product.prix_vente) * 100)}%
                </span>
              )}
            </div>

            <p className="text-foreground/70 leading-relaxed mb-6">{product.description_longue}</p>

            {/* Taille */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-foreground mb-2 block">Taille / Couleur</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button key={v.id} onClick={() => setSelectedVariant(i)}
                    className={`text-sm px-4 py-2 rounded-lg border transition-colors ${i === selectedVariant ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-foreground/80'}`}>
                    {v.taille} - {v.couleur}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock + urgence */}
            <div className="mb-5 max-w-sm">
              <StockProgress urgency={getStockUrgency(product)} size="md" />
            </div>

            {/* Quantité */}
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-semibold text-foreground">Quantité</label>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-secondary transition-colors"><Minus className="h-4 w-4" /></button>
                <span className="px-4 text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-secondary transition-colors"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button size="lg" onClick={handleAddToCart} disabled={variant.stock === 0} className="flex-1 font-semibold">
                <ShoppingBag className="h-5 w-5 mr-2" /> Ajouter au panier
              </Button>
              <a href={`https://wa.me/2250151310606?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="lg" className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="h-5 w-5 mr-2" /> Commander via WhatsApp
                </Button>
              </a>
            </div>

            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
              <Heart className="h-4 w-4" /> Ajouter aux favoris
            </button>

            {/* Réassurance */}
            <div className="border-t border-border pt-6 space-y-3">
              {[
                { icon: Truck, text: 'Livraison en 24-72h à Abidjan' },
                { icon: RotateCcw, text: 'Échanges et retours sous 7 jours' },
                { icon: ShieldCheck, text: 'Paiement 100% sécurisé' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground/70">
                  <Icon className="h-4 w-4 text-primary" /> {text}
                </div>
              ))}
            </div>

            {/* Détails */}
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="font-semibold text-sm text-foreground mb-2">Détails</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-foreground/70">
                <span>Référence</span><span className="font-medium text-foreground">{product.code_produit}</span>
                <span>Tranche d'âge</span><span className="font-medium text-foreground">{product.tranche_age || '—'}</span>
                <span>Genre</span><span className="font-medium text-foreground capitalize">{product.sexe}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Similaires */}
        {similaires.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {similaires.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
