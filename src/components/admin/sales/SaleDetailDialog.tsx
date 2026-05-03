import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Printer, FileDown, XCircle } from 'lucide-react';
import { fcfa, shortDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { downloadReceiptA4, printThermalReceipt, ReceiptData } from '@/lib/receipt';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/contexts/AuthContext';

export default function SaleDetailDialog({
  saleId, open, onClose, onChanged,
}: {
  saleId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sale, setSale] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [motif, setMotif] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!saleId || !open) return;
    setLoading(true);
    Promise.all([
      supabase.from('sales').select('*').eq('id', saleId).maybeSingle(),
      supabase.from('sale_items').select('*').eq('sale_id', saleId),
    ]).then(([{ data: s }, { data: it }]) => {
      setSale(s); setItems(it ?? []); setLoading(false);
    });
  }, [saleId, open]);

  const buildReceipt = (): ReceiptData | null => {
    if (!sale) return null;
    return {
      numero_vente: sale.numero_vente,
      created_at: sale.created_at,
      vendeur_nom: sale.vendeur_nom,
      mode_paiement: sale.mode_paiement,
      paiements: sale.paiements,
      sous_total: sale.sous_total,
      remise: sale.remise,
      total: sale.total,
      montant_recu: sale.montant_recu,
      statut: sale.statut,
      items: items.map((it) => ({ ...it, remise_ligne: it.remise_ligne })),
    };
  };

  const cancel = async () => {
    if (!sale || !motif.trim()) { toast.error('Motif requis'); return; }
    setCancelling(true);
    // Restituer le stock
    for (const it of items) {
      if (!it.variant_id) continue;
      const { data: v } = await supabase.from('product_variants').select('stock').eq('id', it.variant_id).maybeSingle();
      if (v) await supabase.from('product_variants').update({ stock: Number(v.stock) + it.quantite }).eq('id', it.variant_id);
    }
    const { error } = await supabase.from('sales').update({
      statut: 'annulee', annulee_le: new Date().toISOString(), annulee_par: user?.id, motif_annulation: motif,
    }).eq('id', sale.id);
    if (error) { toast.error(error.message); setCancelling(false); return; }
    await logActivity('cancel', 'sales', sale.id, { numero: sale.numero_vente, motif });
    toast.success('Vente annulée et stock restitué');
    setCancelling(false); setConfirmCancel(false); onChanged(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sale ? `Vente ${sale.numero_vente}` : 'Détail vente'}</DialogTitle>
        </DialogHeader>
        {loading || !sale ? (
          <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Date :</span> {shortDateTime(sale.created_at)}</div>
              <div><span className="text-muted-foreground">Vendeuse :</span> {sale.vendeur_nom || '—'}</div>
              <div><span className="text-muted-foreground">Mode :</span> {sale.mode_paiement}</div>
              <div>
                <span className="text-muted-foreground">Statut :</span>{' '}
                <span className={sale.statut === 'annulee' ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                  {sale.statut === 'annulee' ? 'Annulée' : 'Validée'}
                </span>
              </div>
            </div>

            {sale.statut === 'annulee' && sale.motif_annulation && (
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm">
                <p className="font-medium text-destructive">Motif d'annulation</p>
                <p className="text-muted-foreground">{sale.motif_annulation}</p>
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left"><tr><th className="p-2">Produit</th><th>Variante</th><th className="text-right">PU</th><th className="text-center">Qté</th><th className="text-right p-2">Total</th></tr></thead>
                <tbody>{items.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="p-2">{it.product_nom}</td>
                    <td>{[it.taille, it.couleur].filter(Boolean).join(' • ') || '—'}</td>
                    <td className="text-right">{fcfa(it.prix_unitaire)}</td>
                    <td className="text-center">{it.quantite}</td>
                    <td className="text-right p-2 font-medium">{fcfa(it.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{fcfa(sale.sous_total)}</span></div>
              {Number(sale.remise) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span>-{fcfa(sale.remise)}</span></div>}
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fcfa(sale.total)}</span></div>
              {sale.montant_recu && <>
                <div className="flex justify-between"><span className="text-muted-foreground">Reçu</span><span>{fcfa(sale.montant_recu)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monnaie rendue</span><span>{fcfa(Math.max(0, Number(sale.montant_recu) - Number(sale.total)))}</span></div>
              </>}
            </div>

            {/* Journal des paiements */}
            {Array.isArray(sale.paiements) && sale.paiements.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                  <span>Journal des paiements</span>
                  <span>{sale.paiements.length} ligne{sale.paiements.length > 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-left">
                    <tr>
                      <th className="p-2 w-10">#</th>
                      <th className="p-2">Mode</th>
                      <th className="p-2">Référence</th>
                      <th className="p-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.paiements.map((p: any, idx: number) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2 text-muted-foreground">{idx + 1}</td>
                        <td className="p-2 capitalize">{String(p.mode ?? '').replace(/_/g, ' ')}</td>
                        <td className="p-2 font-mono text-xs">{p.reference || <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-2 text-right font-medium tabular-nums">{fcfa(Number(p.montant) || 0)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-muted/30 font-semibold">
                      <td className="p-2" colSpan={3}>Total encaissé</td>
                      <td className="p-2 text-right tabular-nums">
                        {fcfa(sale.paiements.reduce((s: number, p: any) => s + (Number(p.montant) || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {confirmCancel && (
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 space-y-2">
                <Label>Motif d'annulation</Label>
                <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} placeholder="Ex: erreur de saisie, retour cliente..." />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => sale && printThermalReceipt(buildReceipt()!)}>
            <Printer className="h-4 w-4 mr-2" /> Ticket 80mm
          </Button>
          <Button variant="outline" size="sm" onClick={() => { const r = sale && buildReceipt(); if (r) downloadReceiptA4(r); }}>
            <FileDown className="h-4 w-4 mr-2" /> PDF A4
          </Button>
          {sale?.statut === 'validee' && (isAdmin || true) && (
            confirmCancel ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)} disabled={cancelling}>Retour</Button>
                <Button variant="destructive" size="sm" onClick={cancel} disabled={cancelling}>
                  {cancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmer l'annulation
                </Button>
              </>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setConfirmCancel(true)}>
                <XCircle className="h-4 w-4 mr-2" /> Annuler la vente
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
