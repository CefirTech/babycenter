import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Layers, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { slugify } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ImageUploader from '@/components/admin/ImageUploader';
import AgeRangesDialog from '@/components/admin/AgeRangesDialog';
import { useAgeRanges } from '@/hooks/useAgeRanges';

const empty = () => ({ nom: '', description: '', genre: '', tranche_age: '', parent_id: null as string | null, image_url: '', ordre: 0, statut: 'publie' });

export default function AdminCategories() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(empty());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ageDialogOpen, setAgeDialogOpen] = useState(false);
  const { ageRanges } = useAgeRanges();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('ordre').order('nom');
    setList(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ nom: c.nom, description: c.description || '', genre: c.genre || '', tranche_age: c.tranche_age || '', parent_id: c.parent_id, image_url: c.image_url || '', ordre: c.ordre, statut: c.statut || 'publie' }); setOpen(true); };

  const save = async () => {
    if (!form.nom) { toast.error('Nom requis'); return; }
    setSaving(true);
    const payload = { ...form, slug: slugify(form.nom), parent_id: form.parent_id || null };
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('update', 'categories', editing.id, { nom: form.nom });
    } else {
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('create', 'categories', data.id, { nom: form.nom });
    }
    toast.success('Enregistré');
    setOpen(false); setSaving(false); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logActivity('delete', 'categories', id);
    toast.success('Supprimée'); setConfirmDel(null); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Catégories</h1>
          <p className="text-muted-foreground text-sm">{list.length} catégories</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setAgeDialogOpen(true)}><Settings2 className="h-4 w-4 mr-2" /> Tranches d'âge</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nouvelle catégorie</Button>
        </div>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-4 font-medium text-muted-foreground">Catégorie</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Genre</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Âge</th>
              <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Parent</th>
              <th className="p-4 font-medium text-muted-foreground">Statut</th>
              <th className="p-4 font-medium text-muted-foreground">Ordre</th>
              <th className="p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>{list.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {c.image_url ? <img src={c.image_url} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center"><Layers className="h-4 w-4 text-primary" /></div>}
                    <div><p className="font-medium text-foreground">{c.nom}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{c.genre || '—'}</td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{c.tranche_age || '—'}</td>
                <td className="p-4 text-muted-foreground hidden lg:table-cell">{list.find(x => x.id === c.parent_id)?.nom || '—'}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.statut === 'brouillon' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    {c.statut === 'brouillon' ? 'Brouillon' : 'Publiée'}
                  </span>
                </td>
                <td className="p-4">{c.ordre}</td>
                <td className="p-4"><div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDel(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Aucune catégorie</td></tr>}
            </tbody>
          </table></div>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? 'Éditer' : 'Nouvelle'} catégorie</DialogTitle>
            <DialogDescription>Renseignez les informations de la catégorie puis enregistrez les changements.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 -mr-2">
            <div><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Genre</Label>
                <Select value={form.genre} onValueChange={v => setForm({ ...form, genre: v })}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>{['fille','garcon','unisexe'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tranche âge</Label><Input value={form.tranche_age} onChange={e => setForm({ ...form, tranche_age: e.target.value })} placeholder="ex: 0-3 ans" /></div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-foreground mb-2">Tranches d'âge disponibles</p>
              <div className="flex flex-wrap gap-2">
                {ageRanges.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setForm({ ...form, tranche_age: range })}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${form.tranche_age === range ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Catégorie parente</Label>
              <Select value={form.parent_id || 'none'} onValueChange={v => setForm({ ...form, parent_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune (racine)</SelectItem>
                  {list.filter(c => !editing || c.id !== editing.id).map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image de la catégorie</Label>
              <ImageUploader bucket="category-images" value={form.image_url ? [form.image_url] : []} onChange={urls => setForm({ ...form, image_url: urls[0] || '' })} multiple={false} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Statut de publication</Label>
                <Select value={form.statut} onValueChange={v => setForm({ ...form, statut: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publie">Publiée (visible sur le site)</SelectItem>
                    <SelectItem value="brouillon">Brouillon (masquée)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Ordre d'affichage</Label><Input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: +e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)} title="Supprimer cette catégorie ?" destructive confirmLabel="Supprimer" onConfirm={() => confirmDel && remove(confirmDel)} />
      <AgeRangesDialog open={ageDialogOpen} onOpenChange={setAgeDialogOpen} ageRanges={ageRanges} />
    </div>
  );
}
