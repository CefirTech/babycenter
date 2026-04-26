import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa, shortDate } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const empty = () => ({ code: '', nom: '', description: '', type: 'pourcentage' as 'pourcentage' | 'montant_fixe', valeur: 10, montant_min_commande: 0, date_debut: new Date().toISOString().slice(0, 10), date_fin: '', utilisations_max: null as number | null, active: true });

export default function AdminPromotions() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(empty());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) toast.error(`Promotions : ${error.message}`);
    setList(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ code: p.code, nom: p.nom, description: p.description || '', type: p.type, valeur: p.valeur, montant_min_commande: p.montant_min_commande || 0, date_debut: p.date_debut?.slice(0, 10), date_fin: p.date_fin?.slice(0, 10) || '', utilisations_max: p.utilisations_max, active: p.active }); setOpen(true); };

  const save = async () => {
    if (!form.code || !form.nom) { toast.error('Code et nom requis'); return; }
    setSaving(true);
    const payload = { ...form, code: form.code.toUpperCase(), date_fin: form.date_fin || null };
    if (editing) {
      const { error } = await supabase.from('promotions').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('update', 'promotions', editing.id, { code: form.code });
    } else {
      const { data, error } = await supabase.from('promotions').insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('create', 'promotions', data.id, { code: form.code });
    }
    toast.success('Enregistrée'); setOpen(false); setSaving(false); load();
  };

  const toggle = async (p: any) => {
    const { error } = await supabase.from('promotions').update({ active: !p.active }).eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logActivity('delete', 'promotions', id);
    toast.success('Supprimée'); setConfirmDel(null); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Promotions</h1>
          <p className="text-muted-foreground text-sm">{list.length} codes promo</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nouveau code promo</Button>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-4 font-medium text-muted-foreground">Code</th>
              <th className="p-4 font-medium text-muted-foreground">Nom</th>
              <th className="p-4 font-medium text-muted-foreground">Réduction</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Période</th>
              <th className="p-4 font-medium text-muted-foreground">Utilisations</th>
              <th className="p-4 font-medium text-muted-foreground">Active</th>
              <th className="p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>{list.map(p => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-4"><span className="font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded inline-flex items-center gap-1"><Tag className="h-3 w-3" />{p.code}</span></td>
                <td className="p-4 font-medium">{p.nom}</td>
                <td className="p-4">{p.type === 'pourcentage' ? `${p.valeur}%` : fcfa(p.valeur)}</td>
                <td className="p-4 text-muted-foreground hidden md:table-cell text-xs">{shortDate(p.date_debut)} → {p.date_fin ? shortDate(p.date_fin) : '∞'}</td>
                <td className="p-4">{p.utilisations}{p.utilisations_max ? ` / ${p.utilisations_max}` : ''}</td>
                <td className="p-4"><Switch checked={p.active} onCheckedChange={() => toggle(p)} /></td>
                <td className="p-4"><div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDel(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Aucune promotion</td></tr>}
            </tbody>
          </table></div>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Éditer' : 'Nouveau'} code promo</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ex: BIENVENUE10" /></div>
            <div><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pourcentage">Pourcentage (%)</SelectItem><SelectItem value="montant_fixe">Montant fixe</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Valeur</Label><Input type="number" value={form.valeur} onChange={e => setForm({ ...form, valeur: +e.target.value })} /></div>
            <div><Label>Montant min commande</Label><Input type="number" value={form.montant_min_commande} onChange={e => setForm({ ...form, montant_min_commande: +e.target.value })} /></div>
            <div><Label>Utilisations max</Label><Input type="number" value={form.utilisations_max ?? ''} onChange={e => setForm({ ...form, utilisations_max: e.target.value ? +e.target.value : null })} /></div>
            <div><Label>Date début</Label><Input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} /></div>
            <div><Label>Date fin</Label><Input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} /></div>
            <div className="col-span-2 flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)} title="Supprimer ce code promo ?" destructive confirmLabel="Supprimer" onConfirm={() => confirmDel && remove(confirmDel)} />
    </div>
  );
}
