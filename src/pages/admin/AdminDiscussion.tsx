import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Lead {
  id: string;
  nom: string | null;
  telephone: string;
  message: string;
  contexte: string | null;
  traite: boolean;
  created_at: string;
}

export default function AdminDiscussion() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);

  const load = async (withLoader = true) => {
    if (withLoader) setLoading(true);
    const { data, error } = await supabase
      .from('chat_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setLeads(data ?? []);
    if (withLoader) setLoading(false);
  };

  useEffect(() => {
    load();
    const handleRefresh = () => load(false);
    const channel = supabase
      .channel('chat_leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_leads' }, () => load(false))
      .subscribe();
    window.addEventListener('chat-leads:refresh', handleRefresh);
    return () => {
      window.removeEventListener('chat-leads:refresh', handleRefresh);
      supabase.removeChannel(channel);
    };
  }, []);

  const toggle = async (lead: Lead) => {
    const { error } = await supabase
      .from('chat_leads')
      .update({ traite: true })
      .eq('id', lead.id);
    if (error) toast.error(error.message);
    else {
      const updatedLead = { ...lead, traite: true };
      setLeads(prev => prev.map(item => item.id === lead.id ? updatedLead : item));
      setSelected(current => current?.id === lead.id ? null : current);
      window.dispatchEvent(new Event('chat-leads:refresh'));
      toast.success('Marqué comme traité');
    }
  };

  const filtered = leads.filter(l => {
    if (filter === 'pending' && l.traite) return false;
    if (filter === 'done' && !l.traite) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.telephone.toLowerCase().includes(q) ||
        (l.nom?.toLowerCase().includes(q)) ||
        l.message.toLowerCase().includes(q);
    }
    return true;
  });

  // Désélectionne le message si il ne correspond plus au filtre actif
  useEffect(() => {
    if (selected && !filtered.find(l => l.id === selected.id)) {
      setSelected(null);
    }
  }, [filter, selected, filtered]);

  const pendingCount = leads.filter(l => !l.traite).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Discussion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Messages reçus depuis le site et le panier · {pendingCount} en attente
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher (nom, téléphone, message)…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {(['pending', 'all', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
            {f === 'pending' ? 'En attente' : f === 'done' ? 'Traités' : 'Tous'}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* Liste */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl divide-y divide-border max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Aucun message</p>
          ) : filtered.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelected(lead)}
              className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${selected?.id === lead.id ? 'bg-muted' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-sm text-foreground truncate">
                  {lead.nom || 'Anonyme'}
                </span>
                {!lead.traite && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{lead.telephone}</p>
              <p className="text-xs text-foreground/70 line-clamp-2 mt-1">{lead.message}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px] capitalize">{lead.contexte || 'chat'}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Détail */}
        <div className="md:col-span-3 bg-card border border-border rounded-xl p-6">
          {!selected ? (
            <div className="text-center text-muted-foreground py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sélectionnez un message pour le consulter</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {selected.nom || 'Client anonyme'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reçu {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true, locale: fr })}
                    {' · '}
                    <span className="capitalize">{selected.contexte || 'chat'}</span>
                  </p>
                </div>
                {selected.traite ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Traité</Badge>
                ) : (
                  <Badge>En attente</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a href={`tel:${selected.telephone}`}>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-2" /> Appeler
                  </Button>
                </a>
                <a
                  href={`https://wa.me/${selected.telephone.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Bonjour ' + (selected.nom || '') + ', merci de nous avoir contactés.')}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                </a>
                {!selected.traite && (
                  <Button size="sm" onClick={() => toggle(selected)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />Marquer traité
                  </Button>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Téléphone</p>
                <p className="text-sm font-medium text-foreground">{selected.telephone}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Message</p>
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
