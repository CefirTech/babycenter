import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag, Trash2, Minus, Plus } from 'lucide-react';

export default function MiniCart({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, total, updateQty, removeItem, itemCount } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Mon panier ({itemCount})</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Votre panier est vide</p>
            <Button onClick={() => onOpenChange(false)} asChild><Link to="/boutique">Découvrir la boutique</Link></Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {items.map(i => {
                const prix = i.product.prix_promo ?? i.product.prix_vente;
                return (
                  <div key={i.variant.id} className="flex gap-3 p-2 border border-border rounded-lg">
                    <img src={i.product.images[0]} alt="" className="w-16 h-20 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{i.product.nom}</p>
                      <p className="text-xs text-muted-foreground">{i.variant.taille} · {i.variant.couleur}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center border border-border rounded">
                          <button onClick={() => updateQty(i.variant.id, i.quantite - 1)} className="p-1"><Minus className="h-3 w-3" /></button>
                          <span className="px-2 text-sm">{i.quantite}</span>
                          <button onClick={() => updateQty(i.variant.id, i.quantite + 1)} className="p-1"><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="text-sm font-semibold">{(prix * i.quantite).toLocaleString('fr-FR')} F</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(i.variant.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Retirer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-semibold"><span>Total</span><span>{total.toLocaleString('fr-FR')} FCFA</span></div>
              <Button className="w-full" onClick={() => onOpenChange(false)} asChild><Link to="/checkout">Commander</Link></Button>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)} asChild><Link to="/panier">Voir le panier</Link></Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
