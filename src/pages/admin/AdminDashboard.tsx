import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, AlertTriangle, Package, Clock, Loader2 } from 'lucide-react';
import { fcfa, shortDate } from '@/lib/format';

const statusColors: Record<string, string> = {
  livree: 'bg-green-100 text-green-700',
  payee: 'bg-blue-100 text-blue-700',
  en_preparation: 'bg-amber-100 text-amber-700',
  en_attente_paiement: 'bg-yellow-100 text-yellow-700',
  expediee: 'bg-purple-100 text-purple-700',
  annulee: 'bg-destructive/10 text-destructive',
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState<any>({ ca: 0, commandes: 0, panier: 0, clientes: 0, byCanal: [], topProd: [], lowStock: 0, pending: 0, recent: [] });

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setDate(1);
      const results = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', start.toISOString()),
        supabase.from('sales').select('*').gte('created_at', start.toISOString()),
        supabase.from('customers').select('id,created_at').gte('created_at', start.toISOString()),
        supabase.from('product_variants').select('stock,seuil_alerte'),
        supabase.from('order_items').select('product_nom,quantite,total'),
      ]);
      const firstErr = results.find(r => r.error)?.error;
      if (firstErr) console.error('[Dashboard]', firstErr);
      const [{ data: orders }, { data: sales }, { data: customers }, { data: variants }, { data: items }] = results;

      const valid = (orders ?? []).filter(o => o.statut !== 'annulee');
      const ca = valid.reduce((s, o) => s + Number(o.total), 0) + (sales ?? []).reduce((s, x) => s + Number(x.total), 0);
      const totalCmd = valid.length + (sales?.length || 0);
      const panier = totalCmd ? ca / totalCmd : 0;
      const pending = (orders ?? []).filter(o => ['en_attente_paiement', 'en_preparation'].includes(o.statut)).length;
      const lowStock = (variants ?? []).filter((v: any) => v.stock <= v.seuil_alerte).length;

      // canals
      const canalMap: Record<string, number> = {};
      valid.forEach(o => canalMap[o.canal] = (canalMap[o.canal] || 0) + Number(o.total));
      if (sales?.length) canalMap['boutique'] = (canalMap['boutique'] || 0) + sales.reduce((s, x) => s + Number(x.total), 0);
      const totalCanal = Object.values(canalMap).reduce((a, b) => a + b, 0) || 1;
      const byCanal = Object.entries(canalMap).map(([canal, montant]) => ({ canal, montant, pourcentage: Math.round((montant / totalCanal) * 100) }));

      // top products
      const prod: Record<string, { nom: string; ventes: number; montant: number }> = {};
      (items ?? []).forEach(it => {
        if (!prod[it.product_nom]) prod[it.product_nom] = { nom: it.product_nom, ventes: 0, montant: 0 };
        prod[it.product_nom].ventes += it.quantite;
        prod[it.product_nom].montant += Number(it.total);
      });
      const topProd = Object.values(prod).sort((a, b) => b.montant - a.montant).slice(0, 5);

      const { data: recent } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);

      setD({ ca, commandes: totalCmd, panier, clientes: customers?.length || 0, byCanal, topProd, lowStock, pending, recent: recent ?? [] });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const kpis = [
    { label: "CA du mois", value: fcfa(d.ca), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Commandes', value: d.commandes, icon: ShoppingCart, color: 'text-blue-600 bg-blue-100' },
    { label: 'Panier moyen', value: fcfa(d.panier), icon: Package, color: 'text-purple-600 bg-purple-100' },
    { label: 'Nouvelles clientes', value: d.clientes, icon: Users, color: 'text-accent bg-accent/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Aperçu de l'activité du mois en cours</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}><CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3"><span className="text-xs text-muted-foreground font-medium">{k.label}</span><div className={`p-2 rounded-lg ${k.color}`}><k.icon className="h-4 w-4" /></div></div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{k.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base font-heading">Ventes par canal</CardTitle></CardHeader><CardContent>
          <div className="space-y-4">
            {d.byCanal.length === 0 && <p className="text-sm text-muted-foreground">Aucune vente ce mois</p>}
            {d.byCanal.map((v: any) => (
              <div key={v.canal}>
                <div className="flex justify-between text-sm mb-1"><span>{v.canal}</span><span className="text-muted-foreground">{v.pourcentage}% — {fcfa(v.montant)}</span></div>
                <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${v.pourcentage}%` }} /></div>
              </div>
            ))}
          </div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base font-heading">Top produits</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            {d.topProd.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée</p>}
            {d.topProd.map((p: any, i: number) => (
              <div key={p.nom} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.nom}</p><p className="text-xs text-muted-foreground">{p.ventes} ventes</p></div>
                <span className="text-sm font-semibold">{fcfa(p.montant)}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-accent/30"><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10"><AlertTriangle className="h-5 w-5 text-accent" /></div>
          <div><p className="font-semibold text-sm">{d.lowStock} produits en alerte stock</p><p className="text-xs text-muted-foreground">Stock inférieur au seuil</p></div>
        </CardContent></Card>
        <Card className="border-primary/30"><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
          <div><p className="font-semibold text-sm">{d.pending} commandes en attente</p><p className="text-xs text-muted-foreground">À traiter</p></div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base font-heading">Commandes récentes</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left"><th className="pb-3 font-medium text-muted-foreground">N°</th><th className="pb-3 font-medium text-muted-foreground">Cliente</th><th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Date</th><th className="pb-3 font-medium text-muted-foreground">Statut</th><th className="pb-3 font-medium text-muted-foreground text-right">Total</th></tr></thead>
          <tbody>{d.recent.map((o: any) => (
            <tr key={o.id} className="border-b border-border last:border-0">
              <td className="py-3 font-medium">{o.numero_commande}</td>
              <td className="py-3">{o.customer_nom}</td>
              <td className="py-3 text-muted-foreground hidden md:table-cell">{shortDate(o.created_at)}</td>
              <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[o.statut] || 'bg-secondary'}`}>{o.statut.replace(/_/g, ' ')}</span></td>
              <td className="py-3 text-right font-medium">{fcfa(o.total)}</td>
            </tr>
          ))}
          {d.recent.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Aucune commande</td></tr>}
          </tbody>
        </table></div>
      </CardContent></Card>
    </div>
  );
}
