import { recentOrders } from '@/data/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  'livrée': 'bg-green-100 text-green-700',
  'payée': 'bg-blue-100 text-blue-700',
  'en préparation': 'bg-amber-100 text-amber-700',
  'en attente de paiement': 'bg-yellow-100 text-yellow-700',
  'expédiée': 'bg-purple-100 text-purple-700',
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const filtered = recentOrders.filter(o => o.numero_commande.toLowerCase().includes(search.toLowerCase()) || o.customer_nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Commandes</h1>
        <p className="text-muted-foreground text-sm">{recentOrders.length} commandes</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par n° ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-muted/50">
                  <th className="p-4 font-medium text-muted-foreground">N° Commande</th>
                  <th className="p-4 font-medium text-muted-foreground">Cliente</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Canal</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="p-4 font-medium text-muted-foreground">Statut</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Total</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{o.numero_commande}</td>
                    <td className="p-4 text-foreground">{o.customer_nom}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{o.canal}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[o.statut] || 'bg-secondary text-foreground'}`}>{o.statut}</span></td>
                    <td className="p-4 text-right font-medium text-foreground">{o.total.toLocaleString('fr-FR')} FCFA</td>
                    <td className="p-4"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></td>
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
