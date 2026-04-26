import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Normalise un numéro pour la comparaison : ne garde que les chiffres
// et supprime un éventuel préfixe pays 225.
const normalizePhone = (raw: string) => {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.startsWith('225') ? digits.slice(3) : digits;
};

export default function QuickCustomerDialog({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: (c: { id: string; nom: string; telephone?: string | null }) => void; }) {
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!nom.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);

    // Vérifier les doublons de téléphone (insensible aux espaces / préfixe)
    const telNorm = normalizePhone(tel);
    if (telNorm) {
      const { data: existing, error: checkErr } = await supabase
        .from('customers')
        .select('id, nom, telephone');
      if (checkErr) { setSaving(false); toast.error(checkErr.message); return; }
      const dup = (existing ?? []).find((c) => normalizePhone(c.telephone ?? '') === telNorm);
      if (dup) {
        setSaving(false);
        toast.error(`Ce numéro existe déjà pour « ${dup.nom} »`);
        return;
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ nom, telephone: tel || null })
      .select('id,nom,telephone')
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Client créé');
    onCreated(data); setNom(''); setTel(''); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Nouveau client</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nom *</Label><Input value={nom} onChange={(e) => setNom(e.target.value)} autoFocus /></div>
          <div><Label>Téléphone</Label><Input value={tel} onChange={(e) => setTel(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
