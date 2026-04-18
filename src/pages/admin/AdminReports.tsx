import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Receipt, Wallet, Coins } from 'lucide-react';
import { fcfa } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(350 45% 55%)', 'hsl(38 70% 55%)', 'hsl(200 50% 50%)', 'hsl(140 40% 50%)', 'hsl(280 40% 55%)', 'hsl(20 60% 55%)'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ ca: 0, ventes: 0, depenses: 0, marge: 0, byMonth: [], byCanal: [], topProducts: [] });

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setMonth(since.getMonth() - 6);
      const [{ data: orders }, { data: sales }, { data: expenses }, { data: orderItems }] = await Promise.all([
        supabase.from('orders').select('total,canal,statut,created_at').gte('created_at', since.toISOString()),
        supabase.from('sales').select('total,created_at').gte('created_at', since.toISOString()),
        supabase.from('expenses').select('montant,date_depense').gte('date_depense', since.toISOString().slice(0, 10)),
        supabase.from('order_items').select('product_nom,quantite,total'),
      ]);

      const validOrders = (orders ?? []).filter(o => o.statut !== 'annulee');
      const ca = validOrders.reduce((s, o) => s + Number(o.total), 0) + (sales ?? []).reduce((s, x) => s + Number(x.total), 0);
      const dep = (expenses ?? []).reduce((s, e) => s + Number(e.montant), 0);

      // By month
      const byMonth: Record<string, { mois: string; ca: number; depenses: number }> = {};
      const ensure = (key: string) => byMonth[key] ||= { mois: key, ca: 0, depenses: 0 };
      validOrders.forEach(o => { const k = o.created_at.slice(0, 7); ensure(k).ca += Number(o.total); });
      (sales ?? []).forEach(s => { const k = s.created_at.slice(0, 7); ensure(k).ca += Number(s.total); });
      (expenses ?? []).forEach(e => { const k = e.date_depense.slice(0, 7); ensure(k).depenses += Number(e.montant); });

      // By canal
      const byCanal: Record<string, number> = {};
      validOrders.forEach(o => { byCanal[o.canal] = (byCanal[o.canal] || 0) + Number(o.total); });
      if ((sales ?? []).length) byCanal['boutique'] = (byCanal['boutique'] || 0) + (sales ?? []).reduce((s, x) => s + Number(x.total), 0);

      // Top products
      const prodMap: Record<string, { nom: string; quantite: number; total: number }> = {};
      (orderItems ?? []).forEach(it => {
        if (!prodMap[it.product_nom]) prodMap[it.product_nom] = { nom: it.product_nom, quantite: 0, total: 0 };
        prodMap[it.product_nom].quantite += it.quantite;
        prodMap[it.product_nom].total += Number(it.total);
      });
      const topProducts = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 5);

      setData({
        ca, ventes: validOrders.length + (sales?.length || 0), depenses: dep, marge: ca - dep,
        byMonth: Object.values(byMonth).sort((a, b) => a.mois.localeCompare(b.mois)),
        byCanal: Object.entries(byCanal).map(([nom, val]) => ({ nom, val })),
        topProducts,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const kpis = [
    { label: "Chiffre d'affaires (6 mois)", value: fcfa(data.ca), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Ventes totales', value: data.ventes, icon: Receipt, color: 'text-blue-600 bg-blue-100' },
    { label: 'Dépenses', value: fcfa(data.depenses), icon: Wallet, color: 'text-destructive bg-destructive/10' },
    { label: 'Marge brute', value: fcfa(data.marge), icon: Coins, color: 'text-accent bg-accent/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Rapports</h1>
        <p className="text-muted-foreground text-sm">Statistiques sur les 6 derniers mois</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}><CardContent className="p-4">
            <div className="flex justify-between items-center mb-3"><span className="text-xs text-muted-foreground">{k.label}</span><div className={`p-2 rounded-lg ${k.color}`}><k.icon className="h-4 w-4" /></div></div>
            <p className="text-xl font-bold">{k.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base font-heading">Évolution CA vs Dépenses</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.byMonth}>
              <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => fcfa(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="ca" fill="hsl(350 45% 55%)" name="CA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="depenses" fill="hsl(38 70% 55%)" name="Dépenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base font-heading">Ventes par canal</CardTitle></CardHeader><CardContent>
          {data.byCanal.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.byCanal} dataKey="val" nameKey="nom" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.nom}>
                  {data.byCanal.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fcfa(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">Aucune donnée</p>}
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base font-heading">Top 5 produits</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Rang</th><th>Produit</th><th>Quantité vendue</th><th className="text-right">CA</th></tr></thead>
          <tbody>{data.topProducts.map((p: any, i: number) => (
            <tr key={p.nom} className="border-b border-border last:border-0">
              <td className="py-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span></td>
              <td className="font-medium">{p.nom}</td>
              <td>{p.quantite}</td>
              <td className="text-right font-medium">{fcfa(p.total)}</td>
            </tr>
          ))}
          {data.topProducts.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Aucune vente</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
