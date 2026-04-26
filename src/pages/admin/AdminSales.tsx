import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Search, Trash2, ShoppingCart, Loader2, FileDown, ChevronLeft, ChevronRight, AlertTriangle, UserPlus, Pause, Play, Ticket, Eye, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa, shortDateTime } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { exportListPDF } from '@/lib/pdf';
import { printThermalReceipt, downloadReceiptA4 } from '@/lib/receipt';
import VariantPickerDialog from '@/components/admin/sales/VariantPickerDialog';
import CheckoutDialog, { CheckoutResult } from '@/components/admin/sales/CheckoutDialog';
import SaleDetailDialog from '@/components/admin/sales/SaleDetailDialog';
import QuickCustomerDialog from '@/components/admin/sales/QuickCustomerDialog';
import CustomerSearchSelect from '@/components/admin/sales/CustomerSearchSelect';

type Line = {
  product_id: string; variant_id: string;
  product_nom: string; taille?: string | null; couleur?: string | null;
  prix_unitaire: number; quantite: number; remise_ligne: number; stock: number;
};

const PAYMENT_METHODS = ['especes','orange_money','moov_money','mtn_money','wave','carte','virement'] as const;
const PARK_KEY = 'admin_sales_parked_v1';

export default function AdminSales() {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [cart, setCart] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState<string>('walkin');
  const [remise, setRemise] = useState(0);
  const [saving, setSaving] = useState(false);

  // Filtres historique
  const [hMode, setHMode] = useState<string>('all');
  const [hStatut, setHStatut] = useState<string>('all');
  const [hDateFrom, setHDateFrom] = useState<string>('');
  const [hDateTo, setHDateTo] = useState<string>('');
  const [hVendeur, setHVendeur] = useState<string>('all');

  // Promo
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<any | null>(null);

  // Dialogs
  const [variantPicker, setVariantPicker] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [quickCustOpen, setQuickCustOpen] = useState(false);

  // Top widgets
  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: v }, { data: cats }, { data: c }, { data: s }, { data: sess }] = await Promise.all([
      supabase.from('products').select('*').eq('statut', 'actif'),
      supabase.from('product_variants').select('*'),
      supabase.from('categories').select('id,nom').order('nom'),
      supabase.from('customers').select('id,nom,telephone').order('nom'),
      supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('cash_sessions').select('*').eq('statut', 'ouverte').order('ouverte_le', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setProducts(p ?? []); setVariants(v ?? []); setCategories(cats ?? []);
    setCustomers(c ?? []); setSales(s ?? []); setActiveSession(sess);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-sales-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()))
      .filter((p) => catFilter === 'all' || p.categorie_id === catFilter)
      .slice(0, 8);
  }, [products, search, catFilter]);

  const stockOf = useCallback((productId: string) => {
    return variants.filter((v) => v.product_id === productId).reduce((s, v) => s + (v.stock ?? 0), 0);
  }, [variants]);

  const lowStockOf = useCallback((productId: string) => {
    const vs = variants.filter((v) => v.product_id === productId);
    if (vs.length === 0) return false;
    const total = vs.reduce((s, v) => s + (v.stock ?? 0), 0);
    const seuil = vs.reduce((s, v) => s + (v.seuil_alerte ?? 3), 0);
    return total > 0 && total <= seuil;
  }, [variants]);

  const openVariantPicker = (p: any) => {
    const vs = variants.filter((v) => v.product_id === p.id);
    if (vs.length === 0) { toast.error('Aucune variante disponible'); return; }
    setVariantPicker({ open: true, product: p });
  };

  const addVariantToCart = (v: any) => {
    const p = products.find((x) => x.id === v.product_id);
    if (!p) return;
    const exists = cart.find((l) => l.variant_id === v.id);
    if (exists) {
      if (exists.quantite + 1 > v.stock) { toast.error('Stock insuffisant'); return; }
      setCart(cart.map((l) => l.variant_id === v.id ? { ...l, quantite: l.quantite + 1 } : l));
    } else {
      setCart([...cart, {
        product_id: p.id, variant_id: v.id, product_nom: p.nom,
        taille: v.taille, couleur: v.couleur,
        prix_unitaire: p.prix_promo ?? p.prix_vente, quantite: 1, remise_ligne: 0, stock: v.stock,
      }]);
    }
  };

  const updateLine = (i: number, patch: Partial<Line>) => {
    const arr = [...cart];
    arr[i] = { ...arr[i], ...patch };
    if (arr[i].quantite < 1) arr[i].quantite = 1;
    if (arr[i].quantite > arr[i].stock) { toast.error('Stock insuffisant'); arr[i].quantite = arr[i].stock; }
    if (arr[i].remise_ligne < 0) arr[i].remise_ligne = 0;
    setCart(arr);
  };

  const totalLine = (l: Line) => Math.max(0, l.prix_unitaire * l.quantite - l.remise_ligne);
  const sousTotal = cart.reduce((s, l) => s + totalLine(l), 0);

  const promoRemise = useMemo(() => {
    if (!promo) return 0;
    if (promo.type === 'pourcentage') return Math.round(sousTotal * (Number(promo.valeur) / 100));
    return Number(promo.valeur);
  }, [promo, sousTotal]);

  const totalRemise = remise + promoRemise;
  const total = Math.max(0, sousTotal - totalRemise);

  // Code promo
  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    const { data, error } = await supabase.from('promotions').select('*').eq('code', promoCode.trim().toUpperCase()).eq('active', true).maybeSingle();
    if (error || !data) { toast.error('Code invalide'); return; }
    if (data.date_fin && new Date(data.date_fin) < new Date()) { toast.error('Code expiré'); return; }
    if (data.montant_min_commande && sousTotal < Number(data.montant_min_commande)) {
      toast.error(`Minimum requis : ${fcfa(data.montant_min_commande)}`); return;
    }
    setPromo(data); toast.success(`Promo "${data.nom}" appliquée`);
  };
  const removePromo = () => { setPromo(null); setPromoCode(''); };

  // Mise en attente
  const parkCart = () => {
    if (cart.length === 0) { toast.error('Panier vide'); return; }
    const parked = JSON.parse(localStorage.getItem(PARK_KEY) || '[]');
    parked.push({ id: Date.now(), label: customers.find((c) => c.id === customerId)?.nom || 'Client de passage', cart, customerId, remise, savedAt: new Date().toISOString() });
    localStorage.setItem(PARK_KEY, JSON.stringify(parked));
    setCart([]); setRemise(0); setPromo(null); setPromoCode(''); setCustomerId('walkin');
    toast.success('Panier mis en attente');
  };
  const [parked, setParked] = useState<any[]>([]);
  useEffect(() => {
    setParked(JSON.parse(localStorage.getItem(PARK_KEY) || '[]'));
  }, [cart.length]);
  const resumeParked = (id: number) => {
    const list = JSON.parse(localStorage.getItem(PARK_KEY) || '[]');
    const found = list.find((p: any) => p.id === id);
    if (!found) return;
    setCart(found.cart); setCustomerId(found.customerId); setRemise(found.remise);
    const newList = list.filter((p: any) => p.id !== id);
    localStorage.setItem(PARK_KEY, JSON.stringify(newList));
    setParked(newList);
    toast.success('Panier repris');
  };

  // Encaissement (via dialog confirmation)
  const performCheckout = async (res: CheckoutResult) => {
    if (cart.length === 0) return;
    setSaving(true);
    const numero_vente = `V-${Date.now().toString().slice(-8)}`;
    const noteClient = res.customer_nom_libre ? `Client : ${res.customer_nom_libre}` : '';
    const { data: sale, error } = await supabase.from('sales').insert({
      numero_vente, mode_paiement: res.mode_principal, sous_total: sousTotal, remise: totalRemise, total,
      customer_id: customerId === 'walkin' ? null : customerId,
      vendeur_id: user?.id, vendeur_nom: user?.user_metadata?.display_name || user?.email,
      session_id: activeSession?.id ?? null,
      paiements: res.paiements, montant_recu: res.montant_recu,
      notes: noteClient || null,
    }).select().single();
    if (error) { toast.error(error.message); setSaving(false); return; }
    const items = cart.map((l) => ({
      sale_id: sale.id, product_id: l.product_id, variant_id: l.variant_id,
      product_nom: l.product_nom, taille: l.taille, couleur: l.couleur,
      prix_unitaire: l.prix_unitaire, quantite: l.quantite, remise_ligne: l.remise_ligne, total: totalLine(l),
    }));
    const { error: itemsErr } = await supabase.from('sale_items').insert(items);
    if (itemsErr) { toast.error(`Lignes : ${itemsErr.message}`); setSaving(false); return; }
    for (const l of cart) {
      const v = variants.find((x) => x.id === l.variant_id);
      if (v) {
        const { error: stockErr } = await supabase.from('product_variants').update({ stock: Math.max(0, v.stock - l.quantite) }).eq('id', l.variant_id);
        if (stockErr) toast.error(`Stock ${l.product_nom} : ${stockErr.message}`);
      }
    }
    if (promo) {
      const { error: promoErr } = await supabase.from('promotions').update({ utilisations: Number(promo.utilisations ?? 0) + 1 }).eq('id', promo.id);
      if (promoErr) console.warn('Compteur promo non mis à jour', promoErr);
    }
    await logActivity('create', 'sales', sale.id, { numero: numero_vente, total });
    toast.success(`Vente ${numero_vente} encaissée — ${fcfa(total)}`);

    // Imprimer le ticket auto
    const receipt = {
      numero_vente, created_at: sale.created_at, vendeur_nom: sale.vendeur_nom,
      mode_paiement: res.mode_principal, paiements: res.paiements,
      sous_total: sousTotal, remise: totalRemise, total, montant_recu: res.montant_recu,
      items: items.map((it) => ({ ...it })),
    };
    setTimeout(() => printThermalReceipt(receipt), 300);

    setCart([]); setRemise(0); setPromo(null); setPromoCode(''); setCheckoutOpen(false); setSaving(false);
    load();
  };

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      if (e.key === 'F2') { e.preventDefault(); document.getElementById('sales-search')?.focus(); }
      if (e.key === 'F9' && cart.length > 0 && !checkoutOpen) { e.preventDefault(); setCheckoutOpen(true); }
      if (e.key === 'Escape' && cart.length > 0) { e.preventDefault(); if (confirm('Vider le panier ?')) setCart([]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart.length, checkoutOpen]);

  // Top stats du jour
  const todayStats = useMemo(() => {
    const todaySales = sales.filter((s) => s.created_at.slice(0, 10) === today && s.statut !== 'annulee');
    const totalJour = todaySales.reduce((s, x) => s + Number(x.total), 0);
    const byVendeur: Record<string, number> = {};
    todaySales.forEach((s) => { const k = s.vendeur_nom || '—'; byVendeur[k] = (byVendeur[k] || 0) + Number(s.total); });
    const topVendeur = Object.entries(byVendeur).sort((a, b) => b[1] - a[1])[0];
    return { count: todaySales.length, total: totalJour, topVendeur };
  }, [sales, today]);

  // Filtres historique
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (hMode !== 'all' && s.mode_paiement !== hMode) return false;
      if (hStatut !== 'all' && s.statut !== hStatut) return false;
      if (hVendeur !== 'all' && s.vendeur_nom !== hVendeur) return false;
      if (hDateFrom && s.created_at.slice(0, 10) < hDateFrom) return false;
      if (hDateTo && s.created_at.slice(0, 10) > hDateTo) return false;
      return true;
    });
  }, [sales, hMode, hStatut, hVendeur, hDateFrom, hDateTo]);

  const vendeurs = useMemo(() => Array.from(new Set(sales.map((s) => s.vendeur_nom).filter(Boolean))), [sales]);

  // Récap par mode de paiement (ventes validées uniquement)
  const recapByMode = useMemo(() => {
    const totals: Record<string, { montant: number; count: number }> = {};
    let grandTotal = 0;
    let totalCount = 0;
    for (const s of filteredSales) {
      if (s.statut === 'annulee') continue;
      totalCount++;
      grandTotal += Number(s.total) || 0;
      const lignes = Array.isArray(s.paiements) && s.paiements.length > 0
        ? s.paiements
        : [{ mode: s.mode_paiement, montant: s.total }];
      for (const p of lignes) {
        const mode = p?.mode || s.mode_paiement || 'autre';
        const montant = Number(p?.montant) || 0;
        if (!totals[mode]) totals[mode] = { montant: 0, count: 0 };
        totals[mode].montant += montant;
        totals[mode].count += 1;
      }
    }
    const entries = Object.entries(totals).sort((a, b) => b[1].montant - a[1].montant);
    return { entries, grandTotal, totalCount };
  }, [filteredSales]);

  const MODE_LABELS: Record<string, string> = {
    especes: 'Espèces',
    orange_money: 'Orange Money',
    moov_money: 'Moov Money',
    mtn_money: 'MTN Money',
    wave: 'Wave',
    carte: 'Carte',
    virement: 'Virement',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Ventes (Caisse)</h1>
          <p className="text-muted-foreground text-sm">Encaisser une vente en boutique — <span className="text-xs">F2 recherche · F9 encaisser · Échap vider</span></p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession ? (
            <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 border border-green-500/30">
              Caisse ouverte par {activeSession.ouverte_par_nom}
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Aucune session de caisse ouverte
            </span>
          )}
        </div>
      </div>

      {/* Widgets du jour */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Ventes aujourd'hui</p><p className="text-xl font-bold">{todayStats.count}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">CA du jour</p><p className="text-xl font-bold text-primary">{fcfa(todayStats.total)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="h-3 w-3" /> Top vendeuse</p><p className="text-sm font-bold truncate">{todayStats.topVendeur ? `${todayStats.topVendeur[0]} — ${fcfa(todayStats.topVendeur[1])}` : '—'}</p></CardContent></Card>
      </div>

      {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="sales-search" placeholder="Rechercher un produit... (F2)" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="sm:w-52"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const stock = stockOf(p.id);
                const out = stock <= 0;
                const low = lowStockOf(p.id);
                return (
                  <button key={p.id} disabled={out} onClick={() => openVariantPicker(p)}
                    className={`text-left bg-card border rounded-xl p-3 transition relative ${
                      out ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary hover:shadow-md'
                    }`}>
                    {(low || out) && (
                      <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${out ? 'bg-destructive text-destructive-foreground' : 'bg-amber-500 text-white'}`}>
                        {out ? 'Rupture' : 'Stock bas'}
                      </span>
                    )}
                    <img src={p.images?.[0] || '/placeholder.svg'} alt="" className="w-full aspect-square object-cover rounded-lg mb-2 bg-muted" />
                    <p className="text-sm font-medium line-clamp-2">{p.nom}</p>
                    <div className="flex items-end justify-between mt-1">
                      <p className="text-sm font-bold text-primary">{fcfa(p.prix_promo ?? p.prix_vente)}</p>
                      <p className="text-[10px] text-muted-foreground">{stock} en stock</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {parked.length > 0 && (
              <Card><CardContent className="p-3">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Pause className="h-3 w-3" /> Paniers en attente ({parked.length})</p>
                <div className="flex gap-2 flex-wrap">
                  {parked.map((p) => (
                    <Button key={p.id} variant="outline" size="sm" onClick={() => resumeParked(p.id)}>
                      <Play className="h-3 w-3 mr-1" /> {p.label} ({p.cart.length})
                    </Button>
                  ))}
                </div>
              </CardContent></Card>
            )}
          </div>

          <Card><CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold"><ShoppingCart className="h-4 w-4" /> Panier ({cart.length})</div>
              {cart.length > 0 && <Button variant="ghost" size="sm" onClick={parkCart}><Pause className="h-3 w-3 mr-1" /> Mettre en attente</Button>}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {cart.map((l, i) => (
                <div key={i} className="border-b border-border pb-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{l.product_nom}</p>
                      <p className="text-xs text-muted-foreground">{[l.taille, l.couleur].filter(Boolean).join(' • ')} • {fcfa(l.prix_unitaire)}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => updateLine(i, { quantite: l.quantite - 1 })}><Minus className="h-3 w-3" /></Button>
                    <span className="w-6 text-center text-sm">{l.quantite}</span>
                    <Button size="sm" variant="ghost" onClick={() => updateLine(i, { quantite: l.quantite + 1 })}><Plus className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setCart(cart.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Remise :</span>
                    <Input type="number" className="h-7 text-xs w-24" value={l.remise_ligne} onChange={(e) => updateLine(i, { remise_ligne: +e.target.value || 0 })} />
                    <span className="ml-auto font-semibold">{fcfa(totalLine(l))}</span>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Panier vide</p>}
            </div>

            <div className="flex gap-1 items-end">
              <div className="flex-1">
                <Label>Cliente</Label>
                <CustomerSearchSelect customers={customers} value={customerId} onChange={setCustomerId} />
              </div>
              <Button variant="outline" size="icon" onClick={() => setQuickCustOpen(true)} title="Nouvelle cliente"><UserPlus className="h-4 w-4" /></Button>
            </div>

            <div>
              <Label>Code promo</Label>
              <div className="flex gap-1">
                <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} disabled={!!promo} />
                {promo
                  ? <Button variant="outline" onClick={removePromo}>Retirer</Button>
                  : <Button variant="outline" onClick={applyPromo}><Ticket className="h-4 w-4" /></Button>}
              </div>
              {promo && <p className="text-xs text-green-600 mt-1">"{promo.nom}" : -{fcfa(promoRemise)}</p>}
            </div>

            <div><Label>Remise additionnelle</Label><Input type="number" value={remise} onChange={(e) => setRemise(+e.target.value || 0)} /></div>

            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{fcfa(sousTotal)}</span></div>
              {totalRemise > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Remise totale</span><span>-{fcfa(totalRemise)}</span></div>}
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fcfa(total)}</span></div>
            </div>
            <Button className="w-full" disabled={saving || cart.length === 0} onClick={() => setCheckoutOpen(true)}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Encaisser (F9)
            </Button>
          </CardContent></Card>
        </div>
      )}

      {/* Historique */}
      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-semibold">Historique des ventes ({filteredSales.length})</p>
          <Button variant="outline" size="sm" onClick={() => exportListPDF({
            title: 'Liste des ventes',
            filename: `ventes-${new Date().toISOString().slice(0, 10)}.pdf`,
            head: ['N°', 'Date', 'Vendeur', 'Mode', 'Statut', 'Sous-total', 'Remise', 'Total'],
            body: filteredSales.map((s) => [s.numero_vente, shortDateTime(s.created_at), s.vendeur_nom || '—', s.mode_paiement, s.statut === 'annulee' ? 'Annulée' : 'Validée', fcfa(s.sous_total), fcfa(s.remise), fcfa(s.total)]),
          })}><FileDown className="h-4 w-4 mr-2" /> Export PDF</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div><Label className="text-xs">Du</Label><Input type="date" value={hDateFrom} onChange={(e) => setHDateFrom(e.target.value)} /></div>
          <div><Label className="text-xs">Au</Label><Input type="date" value={hDateTo} onChange={(e) => setHDateTo(e.target.value)} /></div>
          <div><Label className="text-xs">Mode</Label>
            <Select value={hMode} onValueChange={setHMode}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous</SelectItem>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Statut</Label>
            <Select value={hStatut} onValueChange={setHStatut}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="validee">Validées</SelectItem><SelectItem value="annulee">Annulées</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Vendeuse</Label>
            <Select value={hVendeur} onValueChange={setHVendeur}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Toutes</SelectItem>{vendeurs.map((v) => <SelectItem key={v as string} value={v as string}>{v as string}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Récap par mode de paiement */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold">Récap encaissements par mode</p>
            <div className="text-xs text-muted-foreground">
              {recapByMode.totalCount} vente{recapByMode.totalCount > 1 ? 's' : ''} —{' '}
              <span className="font-semibold text-foreground">{fcfa(recapByMode.grandTotal)}</span>
            </div>
          </div>
          {recapByMode.entries.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun encaissement sur cette période.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {recapByMode.entries.map(([mode, info]) => {
                const pct = recapByMode.grandTotal > 0 ? (info.montant / recapByMode.grandTotal) * 100 : 0;
                return (
                  <div key={mode} className="rounded-md border border-border bg-background px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium capitalize">{MODE_LABELS[mode] ?? mode.replace(/_/g, ' ')}</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="font-bold tabular-nums">{fcfa(info.montant)}</div>
                    <div className="text-[11px] text-muted-foreground">{info.count} ligne{info.count > 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SalesTable sales={filteredSales} onView={(id) => setDetailId(id)} />
      </CardContent></Card>

      <VariantPickerDialog
        open={variantPicker.open}
        product={variantPicker.product}
        variants={variants.filter((v) => v.product_id === variantPicker.product?.id)}
        onClose={() => setVariantPicker({ open: false, product: null })}
        onPick={(v) => addVariantToCart(v)}
      />
      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} total={total} onConfirm={performCheckout} saving={saving} customers={customers} customerId={customerId} onCustomerChange={setCustomerId} />
      <SaleDetailDialog saleId={detailId} open={!!detailId} onClose={() => setDetailId(null)} onChanged={load} />
      <QuickCustomerDialog open={quickCustOpen} onClose={() => setQuickCustOpen(false)} onCreated={(c) => { setCustomers((arr) => [...arr, c]); setCustomerId(c.id); }} />
    </div>
  );
}

function SalesTable({ sales, onView }: { sales: any[]; onView: (id: string) => void }) {
  const { page, setPage, totalPages, paged } = usePagination(sales, 10);
  return (
    <>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">N°</th><th>Date</th><th>Vendeur</th><th>Mode</th><th>Statut</th><th className="text-right">Total</th><th></th></tr></thead>
        <tbody>{paged.map((s) => (
          <tr key={s.id} className={`border-b border-border last:border-0 ${s.statut === 'annulee' ? 'opacity-60 line-through' : ''}`}>
            <td className="py-2 font-medium">{s.numero_vente}</td>
            <td>{shortDateTime(s.created_at)}</td>
            <td>{s.vendeur_nom || '—'}</td>
            <td>{s.mode_paiement}</td>
            <td>{s.statut === 'annulee' ? <span className="text-destructive text-xs">Annulée</span> : <span className="text-green-600 text-xs">Validée</span>}</td>
            <td className="text-right font-medium">{fcfa(s.total)}</td>
            <td className="text-right"><Button variant="ghost" size="sm" onClick={() => onView(s.id)}><Eye className="h-4 w-4" /></Button></td>
          </tr>
        ))}
        {sales.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Aucune vente</td></tr>}
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
