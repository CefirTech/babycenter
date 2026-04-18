import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa, shortDate } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const empty = () => ({ nom: '', telephone: '', email: '', ville: '', adresse: '', notes: '' });

export default function AdminCustomers() {
  const [list, setList] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { commandes: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<any | null>(null);
  const [viewOrders, setViewOrders] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(empty());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: o }] = await Promise.all([
      supabase.from('customers').select('*').order('nom'),
      supabase.from('orders').select('customer_id,total'),
    ]);
    const s: Record<string, { commandes: number; total: number }> = {};
    (o ?? []).forEach(x => {
      if (!x.customer_id) return;
      if (!s[x.customer_id]) s[x.customer_id] = { commandes: 0, total: 0 };
      s[x.customer_id].commandes++;
      s[x.customer_id].total += Number(x.total);
    });
    setStats(s);
    setList(c ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ nom: c.nom, telephone: c.telephone || '', email: c.email || '', ville: c.ville || '', adresse: c.adresse || '', notes: c.notes || '' }); setOpen(true); };

  const openView = async (c: any) => {
    setView(c);
    const { data } = await supabase.from('orders').select('*').eq('customer_id', c.id).order('created_at', { ascending: false });
    setViewOrders(data ?? []);
  };

  const save = async () => {
    if (!form.nom) { toast.error('Nom requis'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('customers').update(form).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('update', 'customers', editing.id, { nom: form.nom });
    } else {
      const { data, error } = await supabase.from('customers').insert(form).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('create', 'customers', data.id, { nom: form.nom });
    }
    toast.success('Enregistrée'); setOpen(false); setSaving(false); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logActivity('delete', 'customers', id);
    toast.success('Supprimée'); setConfirmDel(null); load();
  };

  const filtered = list.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()) || (c.telephone || '').includes(search));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm">{list.length} clientes enregistrées</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Ajouter une cliente</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-4 font-medium text-muted-foreground">Nom</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Téléphone</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Ville</th>
              <th className="p-4 font-medium text-muted-foreground">Cmd</th>
              <th className="p-4 font-medium text-muted-foreground text-right">Total dépensé</th>
              <th className="p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>{filtered.map(c => {
              const st = stats[c.id] || { commandes: 0, total: 0 };
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-4"><p className="font-medium">{c.nom}</p><p className="text-xs text-muted-foreground">{c.email || '—'}</p></td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{c.telephone || '—'}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{c.ville || '—'}</td>
                  <td className="p-4">{st.commandes}</td>
                  <td className="p-4 text-right font-medium">{fcfa(st.total)}</td>
                  <td className="p-4"><div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openView(c)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDel(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Aucune cliente</td></tr>}
            </tbody>
          </table></div>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Éditer' : 'Nouvelle'} cliente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Ville</Label><Input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} /></div>
            <div className="col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{view?.nom}</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Téléphone:</span> {view.telephone || '—'}</div>
                <div><span className="text-muted-foreground">Email:</span> {view.email || '—'}</div>
                <div><span className="text-muted-foreground">Ville:</span> {view.ville || '—'}</div>
                <div><span className="text-muted-foreground">Adresse:</span> {view.adresse || '—'}</div>
                {view.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {view.notes}</div>}
              </div>
              <div>
                <p className="font-medium mb-2">Historique commandes ({viewOrders.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewOrders.map(o => (
                    <div key={o.id} className="flex justify-between text-sm border-b border-border py-2">
                      <div><p className="font-medium">{o.numero_commande}</p><p className="text-xs text-muted-foreground">{shortDate(o.created_at)} • {o.statut}</p></div>
                      <span className="font-medium">{fcfa(o.total)}</span>
                    </div>
                  ))}
                  {viewOrders.length === 0 && <p className="text-sm text-muted-foreground">Aucune commande</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)} title="Supprimer cette cliente ?" destructive confirmLabel="Supprimer" onConfirm={() => confirmDel && remove(confirmDel)} />
    </div>
  );
}
