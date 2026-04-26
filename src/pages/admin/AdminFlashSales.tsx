import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Zap, Pencil } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface FlashSaleRow {
  id: string;
  product_id: string;
  titre: string;
  prix_flash: number;
  date_debut: string;
  date_fin: string;
  stock_initial: number;
  stock_vendu: number;
  active: boolean;
  product?: { nom: string; prix_vente: number; images: string[] | null } | null;
}

interface ProductLite { id: string; nom: string; prix_vente: number; }

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
};

const fromLocalInput = (local: string) => new Date(local).toISOString();

export default function AdminFlashSales() {
  const [rows, setRows] = useState<FlashSaleRow[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FlashSaleRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FlashSaleRow | null>(null);

  // Form state
  const defaultEnd = useMemo(() => {
    const d = new Date(); d.setHours(d.getHours() + 24);
    return toLocalInput(d.toISOString());
  }, []);
  const [form, setForm] = useState({
    product_id: '',
    titre: 'Ventes Flash',
    prix_flash: '',
    date_debut: toLocalInput(new Date().toISOString()),
    date_fin: defaultEnd,
    stock_initial: '50',
    active: true,
  });

  const resetForm = () => setForm({
    product_id: '',
    titre: 'Ventes Flash',
    prix_flash: '',
    date_debut: toLocalInput(new Date().toISOString()),
    date_fin: defaultEnd,
    stock_initial: '50',
    active: true,
  });

  const load = async () => {
    setLoading(true);
    const [{ data: fs }, { data: ps }] = await Promise.all([
      supabase.from('flash_sales')
        .select('*, product:products(nom, prix_vente, images)')
        .order('created_at', { ascending: false }),
      supabase.from('products').select('id, nom, prix_vente').eq('statut', 'actif').order('nom'),
    ]);
    setRows((fs as any) ?? []);
    setProducts((ps as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); resetForm(); setOpen(true); };

  const openEdit = (row: FlashSaleRow) => {
    setEditing(row);
    setForm({
      product_id: row.product_id,
      titre: row.titre,
      prix_flash: String(row.prix_flash),
      date_debut: toLocalInput(row.date_debut),
      date_fin: toLocalInput(row.date_fin),
      stock_initial: String(row.stock_initial),
      active: row.active,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_id) { toast({ title: 'Choisissez un produit', variant: 'destructive' }); return; }
    const prix = Number(form.prix_flash);
    const stock = Number(form.stock_initial);
    if (!Number.isFinite(prix) || prix < 0) { toast({ title: 'Prix flash invalide', variant: 'destructive' }); return; }
    if (!Number.isFinite(stock) || stock <= 0) { toast({ title: 'Stock invalide', variant: 'destructive' }); return; }
    if (new Date(form.date_fin) <= new Date(form.date_debut)) {
      toast({ title: 'La date de fin doit être après le début', variant: 'destructive' }); return;
    }

    const payload = {
      product_id: form.product_id,
      titre: form.titre.trim() || 'Ventes Flash',
      prix_flash: prix,
      date_debut: fromLocalInput(form.date_debut),
      date_fin: fromLocalInput(form.date_fin),
      stock_initial: stock,
      active: form.active,
    };

    const { error } = editing
      ? await supabase.from('flash_sales').update(payload).eq('id', editing.id)
      : await supabase.from('flash_sales').insert(payload);

    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'Vente flash mise à jour' : 'Vente flash créée' });
    setOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('flash_sales').delete().eq('id', confirmDelete.id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Vente flash supprimée' });
    setConfirmDelete(null);
    load();
  };

  const toggleActive = async (row: FlashSaleRow) => {
    const { error } = await supabase.from('flash_sales').update({ active: !row.active }).eq('id', row.id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    load();
  };

  const statusOf = (row: FlashSaleRow) => {
    const now = new Date();
    const start = new Date(row.date_debut);
    const end = new Date(row.date_fin);
    if (!row.active) return { label: 'Inactif', variant: 'secondary' as const };
    if (now < start) return { label: 'À venir', variant: 'outline' as const };
    if (now > end) return { label: 'Expiré', variant: 'secondary' as const };
    return { label: 'En cours', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-destructive fill-destructive" />
            Ventes Flash
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Créez des offres limitées dans le temps avec stock dédié pour stimuler les ventes.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nouvelle vente flash</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune vente flash configurée.</p>
          <Button onClick={openCreate} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Créer la première</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Produit</th>
                <th className="text-left px-4 py-3 font-medium">Prix flash</th>
                <th className="text-left px-4 py-3 font-medium">Période</th>
                <th className="text-left px-4 py-3 font-medium">Stock</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const s = statusOf(r);
                const restant = Math.max(0, r.stock_initial - r.stock_vendu);
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.product?.nom || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{r.prix_flash.toLocaleString('fr-FR')} FCFA</div>
                      {r.product && r.product.prix_vente > r.prix_flash && (
                        <div className="text-xs text-muted-foreground line-through">{r.product.prix_vente.toLocaleString('fr-FR')} FCFA</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>{new Date(r.date_debut).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      <div>→ {new Date(r.date_fin).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{restant} / {r.stock_initial}</div>
                      <div className="h-1 w-24 bg-secondary rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${(r.stock_vendu / r.stock_initial) * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(r)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la vente flash' : 'Nouvelle vente flash'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produit</Label>
              <Select value={form.product_id} onValueChange={(v) => {
                const p = products.find(x => x.id === v);
                setForm(f => ({
                  ...f,
                  product_id: v,
                  prix_flash: p && !f.prix_flash ? String(Math.round(p.prix_vente * 0.7)) : f.prix_flash,
                }));
              }}>
                <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nom} — {p.prix_vente.toLocaleString('fr-FR')} FCFA</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Titre du badge</Label>
              <Input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ventes Flash" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prix flash (FCFA)</Label>
                <Input type="number" min={0} value={form.prix_flash} onChange={e => setForm(f => ({ ...f, prix_flash: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock total</Label>
                <Input type="number" min={1} value={form.stock_initial} onChange={e => setForm(f => ({ ...f, stock_initial: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Début</Label>
                <Input type="datetime-local" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Fin</Label>
                <Input type="datetime-local" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">Visible immédiatement sur la boutique</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Supprimer la vente flash ?"
        description="Cette action est définitive."
        onConfirm={handleDelete}
      />
    </div>
  );
}
