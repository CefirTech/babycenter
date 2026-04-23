import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { fcfa } from '@/lib/format';

const PAYMENT_METHODS = ['especes','orange_money','moov_money','mtn_money','wave','carte','virement'] as const;
type Mode = typeof PAYMENT_METHODS[number];

export type CheckoutResult = {
  paiements: { mode: Mode; montant: number }[];
  mode_principal: Mode;
  montant_recu: number;
  monnaie: number;
};

export default function CheckoutDialog({
  open, onClose, total, onConfirm, saving,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (res: CheckoutResult) => void;
  saving: boolean;
}) {
  const [paiements, setPaiements] = useState<{ mode: Mode; montant: number }[]>([{ mode: 'especes', montant: 0 }]);
  const [montantRecu, setMontantRecu] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setPaiements([{ mode: 'especes', montant: total }]);
      setMontantRecu(total);
    }
  }, [open, total]);

  const totalPayé = useMemo(() => paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0), [paiements]);
  const monnaie = montantRecu - total;
  const especesLine = paiements.find((p) => p.mode === 'especes');
  const showMonnaie = !!especesLine && especesLine.montant > 0;
  const valid = Math.abs(totalPayé - total) < 1 && (!showMonnaie || montantRecu >= (especesLine?.montant ?? 0));

  const updateLine = (i: number, patch: Partial<{ mode: Mode; montant: number }>) => {
    setPaiements((arr) => arr.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  };
  const addLine = () => setPaiements((a) => [...a, { mode: 'wave', montant: Math.max(0, total - totalPayé) }]);
  const removeLine = (i: number) => setPaiements((a) => a.filter((_, j) => j !== i));

  const submit = () => {
    if (!valid) return;
    onConfirm({
      paiements,
      mode_principal: paiements[0]?.mode ?? 'especes',
      montant_recu: showMonnaie ? montantRecu : total,
      monnaie: showMonnaie ? monnaie : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Encaisser — {fcfa(total)}</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Paiements</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Ajouter</Button>
            </div>
            <div className="space-y-2">
              {paiements.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={p.mode} onValueChange={(v: Mode) => updateLine(i, { mode: v })}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" className="w-32" value={p.montant} onChange={(e) => updateLine(i, { montant: +e.target.value || 0 })} />
                  {paiements.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showMonnaie && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div>
                <Label>Montant reçu (espèces)</Label>
                <Input type="number" value={montantRecu} onChange={(e) => setMontantRecu(+e.target.value || 0)} />
              </div>
              <div className="flex justify-between text-sm">
                <span>Monnaie à rendre</span>
                <span className={`font-bold ${monnaie < 0 ? 'text-destructive' : 'text-primary'}`}>{fcfa(Math.max(0, monnaie))}</span>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total à payer</span><span className="font-bold">{fcfa(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total saisi</span><span className={Math.abs(totalPayé - total) < 1 ? '' : 'text-destructive font-medium'}>{fcfa(totalPayé)}</span></div>
            {Math.abs(totalPayé - total) >= 1 && (
              <p className="text-xs text-destructive">Le total des paiements doit être égal au total de la vente.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
