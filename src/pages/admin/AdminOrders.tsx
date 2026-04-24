import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Search, Loader2, FileDown, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { fcfa, shortDate } from '@/lib/format';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import { usePagination } from '@/hooks/usePagination';
import { exportListPDF } from '@/lib/pdf';

function exportCSV(filename: string, rows: (string | number)[][]) {
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\uFEFF' + rows.map(r => r.map(escape).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const STATUSES = ['en_attente_paiement','payee','en_preparation','expediee','livree','annulee'] as const;
const statusColors: Record<string, string> = {
  livree: 'bg-green-100 text-green-700',
  payee: 'bg-blue-100 text-blue-700',
  en_preparation: 'bg-amber-100 text-amber-700',
  en_attente_paiement: 'bg-yellow-100 text-yellow-700',
  expediee: 'bg-purple-100 text-purple-700',
  annulee: 'bg-destructive/10 text-destructive',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [editStatus, setEditStatus] = useState<string>('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin_orders_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const o: any = payload.new;
        toast.success(`Nouvelle commande : ${o.numero_commande}`, { description: `${o.customer_nom} — ${fcfa(o.total)}` });
        load();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const open = async (o: any) => {
    setViewing(o);
    setEditStatus(o.statut);
    setNotes(o.notes || '');
    const { data } = await supabase.from('order_items').select('*').eq('order_id', o.id);
    setItems(data ?? []);
  };

  const updateStatus = async () => {
    if (!viewing) return;
    const { error } = await supabase.from('orders').update({ statut: editStatus as any, notes }).eq('id', viewing.id);
    if (error) { toast.error(error.message); return; }
    await logActivity('update_status', 'orders', viewing.id, { statut: editStatus });
    toast.success('Commande mise à jour');
    setViewing(null); load();
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.numero_commande.toLowerCase().includes(search.toLowerCase()) || o.customer_nom.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || o.statut === filter;
    return matchSearch && matchFilter;
  });
  const { page, setPage, totalPages, paged } = usePagination(filtered, 10);

  const exportPDF = () => {
    exportListPDF({
      title: 'Liste des commandes',
      filename: `commandes-${new Date().toISOString().slice(0,10)}.pdf`,
      head: ['N°', 'Cliente', 'Téléphone', 'Canal', 'Date', 'Statut', 'Mode paiement', 'Total'],
      body: filtered.map(o => [o.numero_commande, o.customer_nom, o.customer_telephone || '—', o.canal, shortDate(o.created_at), o.statut.replace(/_/g,' '), o.mode_paiement || '—', fcfa(o.total)]),
    });
  };

  const exportCSVFile = () => {
    const head = ['N°', 'Cliente', 'Téléphone', 'Adresse', 'Canal', 'Date', 'Statut', 'Mode paiement', 'Sous-total', 'Livraison', 'Remise', 'Total'];
    const body = filtered.map(o => [
      o.numero_commande, o.customer_nom, o.customer_telephone || '', o.customer_adresse || '',
      o.canal, shortDate(o.created_at), o.statut, o.mode_paiement || '',
      o.sous_total, o.frais_livraison, o.remise, o.total,
    ]);
    exportCSV(`commandes-${new Date().toISOString().slice(0,10)}.csv`, [head, ...body]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Commandes</h1>
        <p className="text-muted-foreground text-sm">{orders.length} commandes au total</p>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportPDF}><FileDown className="h-4 w-4 mr-2" /> Export PDF</Button>
        <Button variant="outline" onClick={exportCSVFile}><FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-4 font-medium text-muted-foreground">N°</th>
              <th className="p-4 font-medium text-muted-foreground">Cliente</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Canal</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="p-4 font-medium text-muted-foreground">Statut</th>
              <th className="p-4 font-medium text-muted-foreground text-right">Total</th>
              <th className="p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>{paged.map(o => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-4 font-medium">{o.numero_commande}</td>
                <td className="p-4">{o.customer_nom}</td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{o.canal}</td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{shortDate(o.created_at)}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[o.statut] || 'bg-secondary'}`}>{o.statut.replace(/_/g, ' ')}</span></td>
                <td className="p-4 text-right font-medium">{fcfa(o.total)}</td>
                <td className="p-4"><Button variant="ghost" size="sm" onClick={() => open(o)}><Eye className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Aucune commande</td></tr>}
            </tbody>
          </table></div>
        )}
      </CardContent></Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} / {totalPages} — {filtered.length} résultats</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Commande {viewing?.numero_commande}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Cliente:</span> {viewing.customer_nom}</div>
                <div><span className="text-muted-foreground">Téléphone:</span> {viewing.customer_telephone || '—'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Adresse:</span> {viewing.customer_adresse || '—'}</div>
                <div><span className="text-muted-foreground">Canal:</span> {viewing.canal}</div>
                <div><span className="text-muted-foreground">Date:</span> {shortDate(viewing.created_at)}</div>
                <div><span className="text-muted-foreground">Mode paiement:</span> {viewing.mode_paiement || '—'}</div>
              </div>

              <div>
                <p className="font-medium mb-2">Articles</p>
                <table className="w-full text-sm border-t border-border">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-2">Produit</th><th>Qté</th><th>PU</th><th className="text-right">Total</th></tr></thead>
                  <tbody>{items.map(it => (
                    <tr key={it.id} className="border-t border-border"><td className="py-2">{it.product_nom}<div className="text-xs text-muted-foreground">{it.taille} • {it.couleur}</div></td><td>{it.quantite}</td><td>{fcfa(it.prix_unitaire)}</td><td className="text-right">{fcfa(it.total)}</td></tr>
                  ))}</tbody>
                </table>
              </div>

              <div className="border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{fcfa(viewing.sous_total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{fcfa(viewing.frais_livraison)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span>-{fcfa(viewing.remise)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fcfa(viewing.total)}</span></div>
              </div>

              <div><Label>Statut</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Fermer</Button>
            <Button onClick={updateStatus}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
