import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Activity, Search } from 'lucide-react';
import { shortDateTime } from '@/lib/format';

export default function AdminActivityLog() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
      setList(data ?? []); setLoading(false);
    })();
  }, []);

  const filtered = list.filter(l =>
    (l.user_nom || '').toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.ressource.toLowerCase().includes(search.toLowerCase())
  );

  const actionColor = (a: string) => {
    if (a.includes('create') || a.includes('open')) return 'bg-green-100 text-green-700';
    if (a.includes('delete')) return 'bg-destructive/10 text-destructive';
    if (a.includes('update') || a.includes('close')) return 'bg-blue-100 text-blue-700';
    return 'bg-secondary text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Journal d'activité</h1>
        <p className="text-muted-foreground text-sm">200 dernières actions</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-4 font-medium text-muted-foreground">Date</th>
              <th className="p-4 font-medium text-muted-foreground">Utilisateur</th>
              <th className="p-4 font-medium text-muted-foreground">Action</th>
              <th className="p-4 font-medium text-muted-foreground">Ressource</th>
              <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Détails</th>
            </tr></thead>
            <tbody>{filtered.map(l => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">{shortDateTime(l.created_at)}</td>
                <td className="p-4">{l.user_nom || '—'}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${actionColor(l.action)}`}>{l.action}</span></td>
                <td className="p-4 text-muted-foreground">{l.ressource}</td>
                <td className="p-4 text-xs text-muted-foreground hidden lg:table-cell"><code className="text-xs">{l.details ? JSON.stringify(l.details) : '—'}</code></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground"><Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />Aucune activité</td></tr>}
            </tbody>
          </table></div>
        )}
      </CardContent></Card>
    </div>
  );
}
