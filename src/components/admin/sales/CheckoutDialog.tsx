import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, Search, User, X, Check } from 'lucide-react';
import { fcfa } from '@/lib/format';

export type CheckoutCustomer = { id: string; nom: string; telephone?: string | null };

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

export type PaiementLigne = { mode: Mode; montant: number; reference?: string };

export type CheckoutResult = {
  paiements: PaiementLigne[];
  mode_principal: Mode;
  montant_recu: number;
  monnaie: number;
};

const needsReference = (m: Mode) =>
  m === 'orange_money' || m === 'moov_money' || m === 'mtn_money' || m === 'wave' || m === 'carte' || m === 'virement';

export default function CheckoutDialog({
  open, onClose, total, onConfirm, saving,
  customers = [], customerId = 'walkin', onCustomerChange,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (res: CheckoutResult) => void;
  saving: boolean;
  customers?: CheckoutCustomer[];
  customerId?: string;
  onCustomerChange?: (id: string) => void;
}) {
  const [split, setSplit] = useState(false);
  const [paiements, setPaiements] = useState<PaiementLigne[]>([{ mode: 'especes', montant: 0 }]);
  const [montantRecu, setMontantRecu] = useState<number>(0);
  const [custQuery, setCustQuery] = useState('');
  const [custOpen, setCustOpen] = useState(false);
  const custBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSplit(false);
      setPaiements([{ mode: 'especes', montant: total, reference: '' }]);
      setMontantRecu(total);
      setCustQuery('');
      setCustOpen(false);
    }
  }, [open, total]);

  // Fermer la liste au clic extérieur
  useEffect(() => {
    if (!custOpen) return;
    const handler = (e: MouseEvent) => {
      if (custBoxRef.current && !custBoxRef.current.contains(e.target as Node)) setCustOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [custOpen]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const filteredCustomers = useMemo(() => {
    const q = custQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.telephone ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [customers, custQuery]);

  // Toggle split en 2 modes
  const toggleSplit = (on: boolean) => {
    setSplit(on);
    if (on) {
      const half = Math.round(total / 2);
      setPaiements([
        { mode: 'especes', montant: half, reference: '' },
        { mode: 'wave', montant: total - half, reference: '' },
      ]);
    } else {
      setPaiements([{ mode: 'especes', montant: total, reference: '' }]);
      setMontantRecu(total);
    }
  };

  const totalPayé = useMemo(() => paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0), [paiements]);
  const monnaie = montantRecu - total;
  const especesLine = paiements.find((p) => p.mode === 'especes');
  const showMonnaie = !split && !!especesLine && especesLine.montant > 0;
  const ecart = totalPayé - total;
  const valid =
    Math.abs(ecart) < 1 &&
    (!showMonnaie || montantRecu >= (especesLine?.montant ?? 0));

  const updateLine = (i: number, patch: Partial<PaiementLigne>) => {
    setPaiements((arr) => arr.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  };

  // Quand on modifie le 1er montant en mode split, on ajuste le 2e auto
  const updateSplitAmount = (i: number, montant: number) => {
    if (!split || paiements.length !== 2) {
      updateLine(i, { montant });
      return;
    }
    const otherMontant = Math.max(0, total - montant);
    setPaiements((arr) =>
      arr.map((p, j) => (j === i ? { ...p, montant } : { ...p, montant: otherMontant }))
    );
  };

  const submit = () => {
    if (!valid) return;
    // Nettoyer les références vides
    const cleanPaiements = paiements.map((p) => ({
      mode: p.mode,
      montant: p.montant,
      ...(p.reference?.trim() ? { reference: p.reference.trim() } : {}),
    }));
    onConfirm({
      paiements: cleanPaiements,
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
            <div className="space-y-2">
              <div>
                <Label className="mb-1.5 block">Mode de paiement</Label>
                <Select value={paiements[0]?.mode} onValueChange={(v: Mode) => updateLine(0, { mode: v, montant: total })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{MODE_LABEL[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {needsReference(paiements[0]?.mode) && (
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">
                    Référence / N° transaction <span className="text-muted-foreground/70">(optionnel)</span>
                  </Label>
                  <Input
                    placeholder="Ex: TXN123456"
                    value={paiements[0]?.reference ?? ''}
                    onChange={(e) => updateLine(0, { reference: e.target.value })}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paiements.map((p, i) => (
                <div key={i} className="space-y-1.5 rounded-lg border border-border p-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paiement {i + 1}</Label>
                  <div className="flex gap-2">
                    <Select value={p.mode} onValueChange={(v: Mode) => updateLine(i, { mode: v })}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{MODE_LABEL[m]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className={`w-36 tabular-nums ${Math.abs(ecart) >= 1 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      value={p.montant}
                      onChange={(e) => updateSplitAmount(i, +e.target.value || 0)}
                    />
                  </div>
                  {needsReference(p.mode) && (
                    <Input
                      placeholder="Référence / N° transaction (optionnel)"
                      value={p.reference ?? ''}
                      onChange={(e) => updateLine(i, { reference: e.target.value })}
                    />
                  )}
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

          {split && (() => {
            const ok = Math.abs(ecart) < 1;
            const restant = total - totalPayé;
            return (
              <div
                className={`rounded-lg border px-4 py-3 space-y-2 transition-colors ${
                  ok
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-destructive/40 bg-destructive/10'
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total vente</span>
                  <span className="font-semibold">{fcfa(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total saisi</span>
                  <span className="font-semibold tabular-nums">{fcfa(totalPayé)}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium pt-1 border-t ${ok ? 'border-green-500/30 text-green-700 dark:text-green-400' : 'border-destructive/30 text-destructive'}`}>
                  {ok ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Montants équilibrés ✓</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {restant > 0
                          ? `Il manque ${fcfa(restant)} pour atteindre le total`
                          : `Surplus de ${fcfa(-restant)} — réduisez un montant`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

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
