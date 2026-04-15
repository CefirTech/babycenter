import { customers } from '@/data/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const filtered = customers.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm">{customers.length} clientes enregistrées</p>
        </div>
        <Button className="font-semibold"><Plus className="h-4 w-4 mr-2" /> Ajouter une cliente</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher une cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-muted/50">
                  <th className="p-4 font-medium text-muted-foreground">Nom</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Téléphone</th>
                  <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Ville</th>
                  <th className="p-4 font-medium text-muted-foreground">Commandes</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Total dépensé</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{c.nom}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{c.telephone}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{c.ville}</td>
                    <td className="p-4 text-foreground">{c.commandes}</td>
                    <td className="p-4 text-right font-medium text-foreground">{c.total_depense.toLocaleString('fr-FR')} FCFA</td>
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
