import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fcfa } from '@/lib/format';
import { AlertTriangle } from 'lucide-react';

type V = { id: string; product_id: string; taille?: string | null; couleur?: string | null; stock: number; seuil_alerte: number };

export default function VariantPickerDialog({
  open, onClose, product, variants, onPick,
}: {
  open: boolean;
  onClose: () => void;
  product: any | null;
  variants: V[];
  onPick: (v: V) => void;
}) {
  if (!product) return null;
  const prix = product.prix_promo ?? product.prix_vente;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.nom} — {fcfa(prix)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {variants.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune variante</p>}
          {variants.map((v) => {
            const out = v.stock <= 0;
            const low = !out && v.stock <= v.seuil_alerte;
            return (
              <button
                key={v.id}
                disabled={out}
                onClick={() => { onPick(v); onClose(); }}
                className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition ${
                  out ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
              >
                <div>
                  <p className="font-medium text-sm">
                    {[v.taille, v.couleur].filter(Boolean).join(' • ') || 'Standard'}
                  </p>
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${out ? 'text-destructive' : low ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {(low || out) && <AlertTriangle className="h-3 w-3" />}
                    Stock : {v.stock} {low && !out && `(seuil ${v.seuil_alerte})`}
                  </p>
                </div>
                <Button size="sm" disabled={out} type="button" tabIndex={-1}>Choisir</Button>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
