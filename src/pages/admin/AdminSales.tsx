import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Search, Trash2, ShoppingCart, Loader2, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { exportListPDF } from '@/lib/pdf';

type Line = { product_id: string; variant_id: string | null; product_nom: string; taille?: string; couleur?: string; prix_unitaire: number; quantite: number };

const PAYMENT_METHODS = ['especes','orange_money','moov_money','mtn_money','wave','carte','virement'] as const;

export default function AdminSales() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState<string>('walkin');
  const [mode, setMode] = useState<typeof PAYMENT_METHODS[number]>('especes');
  const [remise, setRemise] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: v }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('products').select('*').eq('statut', 'actif'),
      supabase.from('product_variants').select('*'),
      supabase.from('customers').select('id,nom').order('nom'),
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
    ]);
    setProducts(p ?? []); setVariants(v ?? []); setCustomers(c ?? []); setSales(s ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())).slice(0, 12), [products, search]);

  const addToCart = (p: any) => {
    const v = variants.find(x => x.product_id === p.id && x.stock > 0);
    if (!v) { toast.error('Aucune variante en stock'); return; }
    const exists = cart.find(l => l.variant_id === v.id);
    if (exists) {
      setCart(cart.map(l => l.variant_id === v.id ? { ...l, quantite: l.quantite + 1 } : l));
    } else {
      setCart([...cart, { product_id: p.id, variant_id: v.id, product_nom: p.nom, taille: v.taille, couleur: v.couleur, prix_unitaire: p.prix_promo ?? p.prix_vente, quantite: 1 }]);
    }
  };

  const updateQty = (i: number, delta: number) => {
    const arr = [...cart];
    arr[i].quantite = Math.max(1, arr[i].quantite + delta);
    setCart(arr);
  };

  const sousTotal = cart.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0);
  const total = Math.max(0, sousTotal - remise);

  const checkout = async () => {
    if (cart.length === 0) { toast.error('Panier vide'); return; }
    setSaving(true);
    const numero_vente = `V-${Date.now().toString().slice(-8)}`;
    const { data: sale, error } = await supabase.from('sales').insert({
      numero_vente, mode_paiement: mode, sous_total: sousTotal, remise, total,
      customer_id: customerId === 'walkin' ? null : customerId,
      vendeur_id: user?.id, vendeur_nom: user?.user_metadata?.display_name || user?.email,
    }).select().single();
    if (error) { toast.error(error.message); setSaving(false); return; }
    const items = cart.map(l => ({ sale_id: sale.id, product_id: l.product_id, variant_id: l.variant_id, product_nom: l.product_nom, taille: l.taille, couleur: l.couleur, prix_unitaire: l.prix_unitaire, quantite: l.quantite, total: l.prix_unitaire * l.quantite }));
    await supabase.from('sale_items').insert(items);
    // Décrémenter le stock
    for (const l of cart) {
      if (!l.variant_id) continue;
      const v = variants.find(x => x.id === l.variant_id);
      if (v) await supabase.from('product_variants').update({ stock: Math.max(0, v.stock - l.quantite) }).eq('id', l.variant_id);
    }
    await logActivity('create', 'sales', sale.id, { numero: numero_vente, total });
    toast.success(`Vente ${numero_vente} encaissée — ${fcfa(total)}`);
    setCart([]); setRemise(0); setSaving(false); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Ventes (Caisse)</h1>
        <p className="text-muted-foreground text-sm">Encaisser une vente en boutique</p>
      </div>

      {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="text-left bg-card border border-border rounded-xl p-3 hover:border-primary hover:shadow-md transition">
                  <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="w-full aspect-square object-cover rounded-lg mb-2 bg-muted" />
                  <p className="text-sm font-medium line-clamp-2">{p.nom}</p>
                  <p className="text-sm font-bold text-primary mt-1">{fcfa(p.prix_promo ?? p.prix_vente)}</p>
                </button>
              ))}
            </div>
          </div>

          <Card><CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold"><ShoppingCart className="h-4 w-4" /> Panier ({cart.length})</div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {cart.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm border-b border-border pb-2">
                  <div className="flex-1 min-w-0"><p className="font-medium truncate">{l.product_nom}</p><p className="text-xs text-muted-foreground">{l.taille} • {l.couleur} • {fcfa(l.prix_unitaire)}</p></div>
                  <Button size="sm" variant="ghost" onClick={() => updateQty(i, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center">{l.quantite}</span>
                  <Button size="sm" variant="ghost" onClick={() => updateQty(i, 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setCart(cart.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Panier vide</p>}
            </div>

            <div><Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="walkin">Client de passage</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Mode de paiement</Label>
              <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Remise</Label><Input type="number" value={remise} onChange={e => setRemise(+e.target.value || 0)} /></div>

            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{fcfa(sousTotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span>-{fcfa(remise)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fcfa(total)}</span></div>
            </div>
            <Button className="w-full" disabled={saving || cart.length === 0} onClick={checkout}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Encaisser</Button>
          </CardContent></Card>
        </div>
      )}

      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Historique des ventes ({sales.length})</p>
          <Button variant="outline" size="sm" onClick={() => exportListPDF({
            title: 'Liste des ventes',
            filename: `ventes-${new Date().toISOString().slice(0,10)}.pdf`,
            head: ['N°', 'Date', 'Vendeur', 'Mode', 'Sous-total', 'Remise', 'Total'],
            body: sales.map(s => [s.numero_vente, new Date(s.created_at).toLocaleString('fr-FR'), s.vendeur_nom || '—', s.mode_paiement, fcfa(s.sous_total), fcfa(s.remise), fcfa(s.total)]),
          })}><FileDown className="h-4 w-4 mr-2" /> Export PDF</Button>
        </div>
        <SalesTable sales={sales} />
      </CardContent></Card>
    </div>
  );
}

function SalesTable({ sales }: { sales: any[] }) {
  const { page, setPage, totalPages, paged } = usePagination(sales, 10);
  return (
    <>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">N°</th><th>Date</th><th>Vendeur</th><th>Mode</th><th className="text-right">Total</th></tr></thead>
        <tbody>{paged.map(s => (
          <tr key={s.id} className="border-b border-border last:border-0">
            <td className="py-2 font-medium">{s.numero_vente}</td>
            <td>{new Date(s.created_at).toLocaleString('fr-FR')}</td>
            <td>{s.vendeur_nom || '—'}</td>
            <td>{s.mode_paiement}</td>
            <td className="text-right font-medium">{fcfa(s.total)}</td>
          </tr>
        ))}
        {sales.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Aucune vente</td></tr>}
        </tbody>
      </table></div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm mt-3">
          <span className="text-muted-foreground">Page {page} / {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
