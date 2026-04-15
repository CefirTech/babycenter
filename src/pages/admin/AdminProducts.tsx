import { products, categories } from '@/data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { useState } from 'react';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));

  const getCatName = (id: string) => categories.find(c => c.id === id)?.nom || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Produits</h1>
          <p className="text-muted-foreground text-sm">{products.length} produits au total</p>
        </div>
        <Button className="font-semibold"><Plus className="h-4 w-4 mr-2" /> Ajouter un produit</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
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
                {filtered.slice(0, 20).map(p => {
                  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0]} alt={p.nom} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{p.nom}</p>
                            <p className="text-xs text-muted-foreground">{p.code_produit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{getCatName(p.categorie_id)}</td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">{p.tranche_age}</td>
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
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
