import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { fcfa } from '@/lib/format';

const PAYMENT_METHODS = ['especes', 'orange_money', 'moov_money', 'mtn_money', 'wave', 'carte', 'virement'] as const;
type Mode = typeof PAYMENT_METHODS[number];

const MODE_LABEL: Record<Mode, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  mtn_money: 'MTN Money',
  wave: 'Wave',
  carte: 'Carte bancaire',
  virement: 'Virement',
};

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
  const [split, setSplit] = useState(false);
  const [paiements, setPaiements] = useState<{ mode: Mode; montant: number }[]>([{ mode: 'especes', montant: 0 }]);
  const [montantRecu, setMontantRecu] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setSplit(false);
      setPaiements([{ mode: 'especes', montant: total }]);
      setMontantRecu(total);
    }
  }, [open, total]);

  // Toggle split en 2 modes
  const toggleSplit = (on: boolean) => {
    setSplit(on);
    if (on) {
      const half = Math.round(total / 2);
      setPaiements([
        { mode: 'especes', montant: half },
        { mode: 'wave', montant: total - half },
      ]);
    } else {
      setPaiements([{ mode: 'especes', montant: total }]);
      setMontantRecu(total);
    }
  };

  const totalPayé = useMemo(() => paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0), [paiements]);
  const monnaie = montantRecu - total;
  const especesLine = paiements.find((p) => p.mode === 'especes');
  const showMonnaie = !split && !!especesLine && especesLine.montant > 0;
  const ecart = totalPayé - total;
  const valid = Math.abs(ecart) < 1 && (!showMonnaie || montantRecu >= (especesLine?.montant ?? 0));

  const updateLine = (i: number, patch: Partial<{ mode: Mode; montant: number }>) => {
    setPaiements((arr) => arr.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  };

  // Quand on modifie le 1er montant en mode split, on ajuste le 2e auto
  const updateSplitAmount = (i: number, montant: number) => {
    if (!split || paiements.length !== 2) {
      updateLine(i, { montant });
      return;
    }
    const other = i === 0 ? 1 : 0;
    const otherMontant = Math.max(0, total - montant);
    setPaiements((arr) =>
      arr.map((p, j) => (j === i ? { ...p, montant } : { ...p, montant: otherMontant }))
    );
  };

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

        <div className="space-y-4">
          {!split ? (
            <div>
              <Label className="mb-1.5 block">Mode de paiement</Label>
              <Select value={paiements[0]?.mode} onValueChange={(v: Mode) => updateLine(0, { mode: v, montant: total })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{MODE_LABEL[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              {paiements.map((p, i) => (
                <div key={i} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Paiement {i + 1}</Label>
                  <div className="flex gap-2">
                    <Select value={p.mode} onValueChange={(v: Mode) => updateLine(i, { mode: v })}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{MODE_LABEL[m]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="w-36"
                      value={p.montant}
                      onChange={(e) => updateSplitAmount(i, +e.target.value || 0)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toggle split */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Label htmlFor="split-toggle" className="cursor-pointer text-sm font-medium">
              Scinder en 2 modes de paiement
            </Label>
            <Switch id="split-toggle" checked={split} onCheckedChange={toggleSplit} />
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

          {split && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total saisi</span>
                <span className={Math.abs(ecart) < 1 ? 'font-medium' : 'text-destructive font-medium'}>{fcfa(totalPayé)}</span>
              </div>
              {Math.abs(ecart) >= 1 && (
                <p className="text-xs text-destructive">
                  {ecart > 0 ? `Surplus de ${fcfa(ecart)}` : `Manque ${fcfa(-ecart)}`}
                </p>
              )}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={!valid || saving}
            className="w-full h-12 text-base"
            size="lg"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Encaisser {fcfa(total)}
          </Button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
