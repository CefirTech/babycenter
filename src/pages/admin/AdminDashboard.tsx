import { dashboardStats, recentOrders } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, AlertTriangle, Package, Clock } from 'lucide-react';

const kpis = [
  { label: "Chiffre d'affaires", value: `${(dashboardStats.chiffre_affaires_mois / 1000).toFixed(0)}K FCFA`, icon: TrendingUp, color: 'text-green-600 bg-green-100' },
  { label: 'Commandes', value: dashboardStats.commandes_mois.toString(), icon: ShoppingCart, color: 'text-blue-600 bg-blue-100' },
  { label: 'Panier moyen', value: `${dashboardStats.panier_moyen.toLocaleString('fr-FR')} FCFA`, icon: Package, color: 'text-purple-600 bg-purple-100' },
  { label: 'Nouvelles clientes', value: dashboardStats.nouvelles_clientes.toString(), icon: Users, color: 'text-accent bg-accent/10' },
];

const statusColors: Record<string, string> = {
  'livrée': 'bg-green-100 text-green-700',
  'payée': 'bg-blue-100 text-blue-700',
  'en préparation': 'bg-accent/10 text-accent',
  'en attente de paiement': 'bg-yellow-100 text-yellow-700',
  'expédiée': 'bg-purple-100 text-purple-700',
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Aperçu de l'activité du magasin — Avril 2025</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ventes par canal */}
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Ventes par canal</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.ventes_par_canal.map(v => (
                <div key={v.canal}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{v.canal}</span>
                    <span className="text-muted-foreground">{v.pourcentage}% — {(v.montant / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${v.pourcentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top produits */}
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Top produits</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats.top_produits.map((p, i) => (
                <div key={p.nom} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.ventes} ventes</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{(p.montant / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-accent/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{dashboardStats.alertes_stock} produits en alerte stock</p>
              <p className="text-xs text-muted-foreground">Stock inférieur au seuil d'alerte</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{dashboardStats.commandes_en_attente} commandes en attente</p>
              <p className="text-xs text-muted-foreground">À traiter aujourd'hui</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes récentes */}
      <Card>
        <CardHeader><CardTitle className="text-base font-heading">Commandes récentes</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">N° Commande</th>
                  <th className="pb-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Canal</th>
                  <th className="pb-3 font-medium text-muted-foreground">Statut</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-foreground">{o.numero_commande}</td>
                    <td className="py-3 text-foreground">{o.customer_nom}</td>
                    <td className="py-3 text-muted-foreground hidden md:table-cell">{o.canal}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[o.statut] || 'bg-secondary text-foreground'}`}>{o.statut}</span>
                    </td>
                    <td className="py-3 text-right font-medium text-foreground">{o.total.toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
