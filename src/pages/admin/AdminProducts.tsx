import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Eye, Trash2, Loader2, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa, slugify } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ImageUploader from '@/components/admin/ImageUploader';
import { useAgeRanges } from '@/hooks/useAgeRanges';
import { usePagination } from '@/hooks/usePagination';
import { exportListPDF } from '@/lib/pdf';

type Product = any;
type Variant = { id?: string; taille: string; couleur: string; stock: number; seuil_alerte: number; sku?: string };

const emptyForm = () => ({
  nom: '', code_produit: '', description: '', categorie_id: '', tranche_age: '', genre: '',
  marque: '', matiere: '', entretien: '',
  prix_achat: 0, prix_vente: 0, prix_promo: null as number | null,
  statut: 'actif' as 'actif' | 'inactif' | 'rupture',
  est_nouveaute: false, est_meilleure_vente: false,
  images: [] as string[],
});

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [variants, setVariants] = useState<Variant[]>([]);
  const [saving, setSaving] = useState(false);
  const { ageRanges } = useAgeRanges();

  const load = async () => {
    setLoading(true);
    const [{ data: p, error: ep }, { data: c, error: ec }, { data: v, error: ev }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('nom'),
      supabase.from('product_variants').select('*'),
    ]);
    if (ep) toast.error(`Produits : ${ep.message}`);
    if (ec) toast.error(`Catégories : ${ec.message}`);
    if (ev) toast.error(`Variantes : ${ev.message}`);
    const variantsByProd = (v ?? []).reduce<Record<string, any[]>>((acc, x) => {
      (acc[x.product_id] ||= []).push(x); return acc;
    }, {});
    setProducts((p ?? []).map(x => ({ ...x, variants: variantsByProd[x.id] ?? [] })));
    setCategories(c ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) || p.code_produit.toLowerCase().includes(search.toLowerCase()));
  const getCatName = (id: string) => categories.find(c => c.id === id)?.nom || '—';
  const { page, setPage, totalPages, paged } = usePagination(filtered, 10);

  const exportPDF = () => {
    exportListPDF({
      title: 'Liste des produits',
      filename: `produits-${new Date().toISOString().slice(0,10)}.pdf`,
      head: ['Code', 'Nom', 'Catégorie', 'Âge', 'Prix vente', 'Prix promo', 'Stock', 'Statut'],
      body: filtered.map(p => {
        const stock = (p.variants ?? []).reduce((s: number, v: any) => s + v.stock, 0);
        return [p.code_produit, p.nom, getCatName(p.categorie_id), p.tranche_age || '—', fcfa(p.prix_vente), p.prix_promo ? fcfa(p.prix_promo) : '—', stock, p.statut];
      }),
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), code_produit: `BC-${Date.now().toString().slice(-6)}` });
    setVariants([{ taille: 'M', couleur: 'Rose', stock: 10, seuil_alerte: 3 }]);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      nom: p.nom, code_produit: p.code_produit, description: p.description || '',
      categorie_id: p.categorie_id || '', tranche_age: p.tranche_age || '', genre: p.genre || '',
      marque: p.marque || '', matiere: p.matiere || '', entretien: p.entretien || '',
      prix_achat: p.prix_achat, prix_vente: p.prix_vente, prix_promo: p.prix_promo,
      statut: p.statut, est_nouveaute: p.est_nouveaute, est_meilleure_vente: p.est_meilleure_vente,
      images: p.images || [],
    });
    setVariants(p.variants?.map((v: any) => ({ id: v.id, taille: v.taille || '', couleur: v.couleur || '', stock: v.stock, seuil_alerte: v.seuil_alerte, sku: v.sku })) || []);
    setDialogOpen(true);
  };

  const openView = (p: Product) => { setEditing(p); setViewOpen(true); };

  const save = async () => {
    if (!form.nom || !form.code_produit) { toast.error('Nom et code requis'); return; }
    setSaving(true);
    const slug = slugify(form.nom) + '-' + form.code_produit.toLowerCase();
    const payload = { ...form, slug, prix_promo: form.prix_promo || null, categorie_id: form.categorie_id || null };
    let productId = editing?.id;
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logActivity('update', 'products', editing.id, { nom: form.nom });
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      productId = data.id;
      await logActivity('create', 'products', data.id, { nom: form.nom });
    }
    // Sync variants : delete missing, upsert others
    if (editing) {
      const keepIds = variants.filter(v => v.id).map(v => v.id);
      await supabase.from('product_variants').delete().eq('product_id', editing.id).not('id', 'in', `(${keepIds.length ? keepIds.join(',') : "''"})`);
    }
    for (const v of variants) {
      const vp = { product_id: productId!, taille: v.taille, couleur: v.couleur, stock: Number(v.stock), seuil_alerte: Number(v.seuil_alerte), sku: v.sku || null };
      if (v.id) await supabase.from('product_variants').update(vp).eq('id', v.id);
      else await supabase.from('product_variants').insert(vp);
    }
    toast.success(editing ? 'Produit mis à jour' : 'Produit créé');
    setDialogOpen(false);
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('product_variants').delete().eq('product_id', id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logActivity('delete', 'products', id);
    toast.success('Produit supprimé');
    setConfirmDel(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Produits</h1>
          <p className="text-muted-foreground text-sm">{products.length} produits au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}><FileDown className="h-4 w-4 mr-2" /> Export PDF</Button>
          <Button onClick={openCreate} className="font-semibold"><Plus className="h-4 w-4 mr-2" /> Ajouter un produit</Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom ou code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left bg-muted/50">
                    <th className="p-4 font-medium text-muted-foreground">Produit</th>
                    <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
                    <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Âge</th>
                    <th className="p-4 font-medium text-muted-foreground">Prix</th>
                    <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                    <th className="p-4 font-medium text-muted-foreground">Statut</th>
                    <th className="p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(p => {
                    const totalStock = (p.variants ?? []).reduce((s: number, v: any) => s + v.stock, 0);
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={p.images?.[0] || '/placeholder.svg'} alt={p.nom} className="w-10 h-10 rounded-lg object-cover bg-muted" loading="lazy" />
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{p.nom}</p>
                              <p className="text-xs text-muted-foreground">{p.code_produit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{getCatName(p.categorie_id)}</td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">{p.tranche_age || '—'}</td>
                        <td className="p-4">
                          <div>
                            <span className="font-medium text-foreground">{(p.prix_promo ?? p.prix_vente).toLocaleString('fr-FR')}</span>
                            {p.prix_promo && <span className="text-xs text-muted-foreground line-through ml-1">{p.prix_vente.toLocaleString('fr-FR')}</span>}
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className={totalStock <= 3 ? 'text-destructive font-medium' : 'text-foreground'}>{totalStock}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>{p.statut}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openView(p)} title="Voir"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Éditer"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(p.id)} title="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Aucun produit</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} / {totalPages} — {filtered.length} résultats</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Éditer le produit' : 'Nouveau produit'}</DialogTitle>
            <DialogDescription>Créez ou modifiez un produit qui sera visible sur le site selon son statut.</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><Label>Code produit *</Label><Input value={form.code_produit} onChange={e => setForm({ ...form, code_produit: e.target.value })} /></div>
            <div><Label>Marque</Label><Input value={form.marque} onChange={e => setForm({ ...form, marque: e.target.value })} /></div>
            <div>
              <Label>Catégorie</Label>
              <Select value={form.categorie_id} onValueChange={v => setForm({ ...form, categorie_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tranche d'âge</Label>
              <Select value={form.tranche_age} onValueChange={v => setForm({ ...form, tranche_age: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {ageRanges.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Genre</Label>
              <Select value={form.genre} onValueChange={v => setForm({ ...form, genre: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>{['fille','garcon','unisexe'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v: any) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['actif','inactif','rupture'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Prix achat (FCFA)</Label><Input type="number" value={form.prix_achat} onChange={e => setForm({ ...form, prix_achat: +e.target.value })} /></div>
            <div><Label>Prix vente (FCFA) *</Label><Input type="number" value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: +e.target.value })} /></div>
            <div><Label>Prix promo (FCFA)</Label><Input type="number" value={form.prix_promo ?? ''} onChange={e => setForm({ ...form, prix_promo: e.target.value ? +e.target.value : null })} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>Matière</Label><Input value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })} /></div>
            <div><Label>Entretien</Label><Input value={form.entretien} onChange={e => setForm({ ...form, entretien: e.target.value })} /></div>

            <div className="md:col-span-2">
              <Label>Images du produit</Label>
              <ImageUploader bucket="product-images" value={form.images} onChange={imgs => setForm({ ...form, images: imgs })} multiple />
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Variantes (taille / couleur / stock)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setVariants([...variants, { taille: '', couleur: '', stock: 0, seuil_alerte: 3 }])}><Plus className="h-3 w-3 mr-1" /> Variante</Button>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-3" placeholder="Taille" value={v.taille} onChange={e => { const a = [...variants]; a[i].taille = e.target.value; setVariants(a); }} />
                    <Input className="col-span-3" placeholder="Couleur" value={v.couleur} onChange={e => { const a = [...variants]; a[i].couleur = e.target.value; setVariants(a); }} />
                    <Input className="col-span-2" type="number" placeholder="Stock" value={v.stock} onChange={e => { const a = [...variants]; a[i].stock = +e.target.value; setVariants(a); }} />
                    <Input className="col-span-2" type="number" placeholder="Seuil" value={v.seuil_alerte} onChange={e => { const a = [...variants]; a[i].seuil_alerte = +e.target.value; setVariants(a); }} />
                    <Button type="button" variant="ghost" size="sm" className="col-span-2" onClick={() => setVariants(variants.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.nom}</DialogTitle>
            <DialogDescription>Détails du produit sélectionné.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(editing.images || []).map((u: string, i: number) => <img key={i} src={u} alt="" className="w-24 h-24 rounded object-cover" />)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Code:</span> {editing.code_produit}</div>
                <div><span className="text-muted-foreground">Catégorie:</span> {getCatName(editing.categorie_id)}</div>
                <div><span className="text-muted-foreground">Marque:</span> {editing.marque || '—'}</div>
                <div><span className="text-muted-foreground">Âge:</span> {editing.tranche_age || '—'}</div>
                <div><span className="text-muted-foreground">Prix vente:</span> {fcfa(editing.prix_vente)}</div>
                <div><span className="text-muted-foreground">Prix promo:</span> {editing.prix_promo ? fcfa(editing.prix_promo) : '—'}</div>
                <div><span className="text-muted-foreground">Matière:</span> {editing.matiere || '—'}</div>
                <div><span className="text-muted-foreground">Statut:</span> {editing.statut}</div>
              </div>
              {editing.description && <div className="text-sm"><p className="text-muted-foreground mb-1">Description:</p>{editing.description}</div>}
              <div>
                <p className="font-medium mb-2">Variantes</p>
                <table className="w-full text-sm border-t border-border">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-2">Taille</th><th>Couleur</th><th>Stock</th><th>Seuil</th></tr></thead>
                  <tbody>{(editing.variants || []).map((v: any) => <tr key={v.id} className="border-t border-border"><td className="py-2">{v.taille}</td><td>{v.couleur}</td><td className={v.stock <= v.seuil_alerte ? 'text-destructive font-medium' : ''}>{v.stock}</td><td>{v.seuil_alerte}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)} title="Supprimer ce produit ?" description="Cette action est irréversible. Les variantes seront aussi supprimées." destructive confirmLabel="Supprimer" onConfirm={() => confirmDel && remove(confirmDel)} />
    </div>
  );
}
