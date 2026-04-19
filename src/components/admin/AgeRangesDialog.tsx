import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import { FALLBACK_AGE_RANGES } from '@/hooks/useAgeRanges';

interface AgeRangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ageRanges: string[];
}

export default function AgeRangesDialog({ open, onOpenChange, ageRanges }: AgeRangesDialogProps) {
  const [values, setValues] = useState<string[]>(FALLBACK_AGE_RANGES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(ageRanges.length > 0 ? ageRanges : FALLBACK_AGE_RANGES);
    }
  }, [ageRanges, open]);

  const updateValue = (index: number, next: string) => {
    setValues((current) => current.map((value, i) => (i === index ? next : value)));
  };

  const addRow = () => {
    setValues((current) => [...current, '']);
  };

  const removeRow = (index: number) => {
    setValues((current) => current.filter((_, i) => i !== index));
  };

  const save = async () => {
    const cleaned = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

    if (cleaned.length === 0) {
      toast.error("Ajoutez au moins une tranche d'âge");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          cle: 'age_ranges',
          description: "Tranches d'âge utilisées sur le site, les catégories et les produits",
          valeur: { v: cleaned },
        },
        { onConflict: 'cle' },
      );

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    await logActivity('update', 'settings', undefined, { key: 'age_ranges', total: cleaned.length });
    window.dispatchEvent(new Event('age-ranges:refresh'));
    toast.success("Tranches d'âge enregistrées");
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer les tranches d'âge</DialogTitle>
          <DialogDescription>
            Ces tranches d&apos;âge seront proposées dans les catégories, les produits et les filtres du site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Liste des tranches d&apos;âge</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </div>

          <div className="space-y-2">
            {values.map((value, index) => (
              <div key={`${index}-${value}`} className="flex items-center gap-2">
                <Input
                  value={value}
                  onChange={(event) => updateValue(index, event.target.value)}
                  placeholder="Ex: 2-4 ans"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  disabled={values.length === 1}
                  aria-label="Supprimer la tranche d'âge"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}