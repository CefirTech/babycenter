import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa, shortDate } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const CATS = ['loyer','fournisseurs','salaires','marketing','logistique','utilities','autre'] as const;
const MODES = ['especes','orange_money','moov_money','mtn_money','wave','carte','virement'] as const;

const empty = () => ({ description: '', montant: 0, categorie: 'autre' as typeof CATS[number], mode_paiement: 'especes' as typeof MODES[number], date_depense: new Date().toISOString().slice(0, 10), justificatif_url: '' });

export default function AdminExpenses() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(empty());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('expenses').select('*').order('date_depense', { ascending: false });
    if (error) toast.error(`Dépenses : ${error.message}`);
    const rows = data ?? [];
    // Récupère les noms des créateurs depuis profiles
    const ids = Array.from(new Set(rows.map(r => r.created_by).filter(Boolean))) as string[];
    let nameMap: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', ids);
      nameMap = Object.fromEntries((profs ?? []).map(p => [p.user_id, p.display_name || p.email || '—']));
    }
    setList(rows.map(r => ({ ...r, _created_by_nom: r.created_by ? (nameMap[r.created_by] || '—') : '—' })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ description: e.description, montant: e.montant, categorie: e.categorie, mode_paiement: e.mode_paiement || 'especes', date_depense: e.date_depense, justificatif_url: e.justificatif_url || '' }); setOpen(true); };

  const save = async () => {
    if (!form.description || !form.montant) { toast.error('Description et montant requis'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('expenses').update(form).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('update', 'expenses', editing.id, { description: form.description });
    } else {
      const { data, error } = await supabase.from('expenses').insert({ ...form, created_by: user?.id }).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('create', 'expenses', data.id, { description: form.description });
    }
    toast.success('Enregistrée'); setOpen(false); setSaving(false); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logActivity('delete', 'expenses', id);
    toast.success('Supprimée'); setConfirmDel(null); load();
  };

  const filtered = list.filter(e => filterCat === 'all' || e.categorie === filterCat);
  const total = filtered.reduce((s, e) => s + Number(e.montant), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dépenses</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} dépenses — Total : <span className="font-semibold text-foreground">{fcfa(total)}</span></p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nouvelle dépense</Button>
      </div>

      <Select value={filterCat} onValueChange={setFilterCat}>
        <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes catégories</SelectItem>
          {CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Card><CardContent className="p-0">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-4 font-medium text-muted-foreground">Date</th>
              <th className="p-4 font-medium text-muted-foreground">Description</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Mode</th>
              <th className="p-4 font-medium text-muted-foreground text-right">Montant</th>
              <th className="p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>{filtered.map(e => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-4">{shortDate(e.date_depense)}</td>
                <td className="p-4 font-medium">{e.description}</td>
                <td className="p-4 text-muted-foreground hidden md:table-cell"><span className="text-xs px-2 py-1 rounded-full bg-secondary">{e.categorie}</span></td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{e.mode_paiement || '—'}</td>
                <td className="p-4 text-right font-medium">{fcfa(e.montant)}</td>
                <td className="p-4"><div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDel(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Aucune dépense</td></tr>}
            </tbody>
          </table></div>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Éditer' : 'Nouvelle'} dépense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Montant (FCFA) *</Label><Input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: +e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={form.date_depense} onChange={e => setForm({ ...form, date_depense: e.target.value })} /></div>
              <div><Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={(v: any) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Mode paiement</Label>
                <Select value={form.mode_paiement} onValueChange={(v: any) => setForm({ ...form, mode_paiement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Justificatif (URL)</Label><Input value={form.justificatif_url} onChange={e => setForm({ ...form, justificatif_url: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)} title="Supprimer cette dépense ?" destructive confirmLabel="Supprimer" onConfirm={() => confirmDel && remove(confirmDel)} />
    </div>
  );
}
