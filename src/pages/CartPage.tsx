import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  const whatsappMsg = encodeURIComponent(
    `Bonjour, je souhaite commander :\n\n${items
      .map(i => `• ${i.product.nom} (${i.variant.taille}/${i.variant.couleur}) × ${i.quantite} = ${((i.product.prix_promo ?? i.product.prix_vente) * i.quantite).toLocaleString('fr-FR')} FCFA`)
      .join('\n')}\n\nTotal : ${total.toLocaleString('fr-FR')} FCFA`,
  );

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-6">Parcourez notre boutique pour trouver des merveilles pour vos enfants</p>
        <Link to="/boutique"><Button size="lg">Découvrir la boutique</Button></Link>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-4xl">
        <Link to="/boutique" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Continuer mes achats
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Mon panier ({items.length})</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const prix = item.product.prix_promo ?? item.product.prix_vente;
              return (
                <div key={item.variant.id} className="flex gap-4 bg-card border border-border rounded-xl p-4">
                  <Link to={`/produit/${item.product.slug}`} className="w-20 h-24 rounded-lg overflow-hidden shrink-0">
                    <img src={item.product.images[0]} alt={item.product.nom} className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/produit/${item.product.slug}`} className="font-medium text-sm text-foreground line-clamp-1 hover:text-primary">
                      {item.product.nom}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.variant.taille} / {item.variant.couleur}</p>
                    <p className="font-semibold text-sm mt-1">{prix.toLocaleString('fr-FR')} FCFA</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border rounded-lg">
                        <button onClick={() => updateQty(item.variant.id, item.quantite - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                        <span className="px-3 text-xs font-medium">{item.quantite}</span>
                        <button onClick={() => updateQty(item.variant.id, item.quantite + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeItem(item.variant.id)} className="text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-24">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Résumé</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{total.toLocaleString('fr-FR')} FCFA</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span className="text-green-600">Gratuite</span></div>
            </div>
            <div className="border-t border-border my-4" />
            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span><span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <Link to="/checkout" className="block">
              <Button size="lg" className="w-full font-semibold">Passer la commande</Button>
            </Link>
            <a href={`https://wa.me/2250151310606?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="block mt-2">
              <Button size="lg" variant="outline" className="w-full font-semibold border-green-600 text-green-600 hover:bg-green-50">
                <MessageCircle className="h-4 w-4 mr-2" /> Commander via WhatsApp
              </Button>
            </a>
            <button onClick={clearCart} className="w-full text-sm text-muted-foreground hover:text-destructive mt-3 py-1 transition-colors">
              Vider le panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
