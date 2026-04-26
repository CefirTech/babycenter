import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PiggyBank, Plus, Loader2, Lock, Unlock, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa, shortDateTime } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminCash() {
  const { user } = useAuth();
  const [session, setSession] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openInit, setOpenInit] = useState(false);
  const [openClose, setOpenClose] = useState(false);
  const [openMove, setOpenMove] = useState(false);
  const [solde, setSolde] = useState(0);
  const [soldeReel, setSoldeReel] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [moveType, setMoveType] = useState<'entree' | 'sortie'>('entree');
  const [moveMontant, setMoveMontant] = useState(0);
  const [moveMotif, setMoveMotif] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: openSess, error: e1 } = await supabase.from('cash_sessions').select('*').eq('statut', 'ouverte').order('ouverte_le', { ascending: false }).limit(1).maybeSingle();
    if (e1) toast.error(`Session : ${e1.message}`);
    setSession(openSess);
    if (openSess) {
      const { data: m, error: e2 } = await supabase.from('cash_movements').select('*').eq('session_id', openSess.id).order('created_at', { ascending: false });
      if (e2) toast.error(`Mouvements : ${e2.message}`);
      setMovements(m ?? []);
    } else {
      setMovements([]);
    }
    const { data: h, error: e3 } = await supabase.from('cash_sessions').select('*').eq('statut', 'fermee').order('fermee_le', { ascending: false }).limit(10);
    if (e3) toast.error(`Historique : ${e3.message}`);
    setHistory(h ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-cash-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_movements' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_sessions' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalEntrees = movements.filter(m => m.type === 'entree').reduce((s, m) => s + Number(m.montant), 0);
  const totalSorties = movements.filter(m => m.type === 'sortie').reduce((s, m) => s + Number(m.montant), 0);
  const theorique = session ? Number(session.solde_ouverture) + totalEntrees - totalSorties : 0;

  const openSession = async () => {
    const { data, error } = await supabase.from('cash_sessions').insert({ solde_ouverture: solde, ouverte_par: user?.id, ouverte_par_nom: user?.user_metadata?.display_name || user?.email }).select().single();
    if (error) { toast.error(error.message); return; }
    await logActivity('open_session', 'cash_sessions', data.id, { solde });
    toast.success('Caisse ouverte'); setOpenInit(false); load();
  };

  const closeSession = async () => {
    if (!session) return;
    const ecart = soldeReel - theorique;
    const { error } = await supabase.from('cash_sessions').update({ statut: 'fermee', solde_theorique: theorique, solde_reel: soldeReel, ecart, notes: closeNotes, fermee_le: new Date().toISOString(), fermee_par: user?.id }).eq('id', session.id);
    if (error) { toast.error(error.message); return; }
    await logActivity('close_session', 'cash_sessions', session.id, { ecart });
    toast.success('Caisse fermée'); setOpenClose(false); setCloseNotes(''); setSoldeReel(0); load();
  };

  const addMovement = async () => {
    if (!session || !moveMontant || !moveMotif) { toast.error('Champs requis'); return; }
    const { error } = await supabase.from('cash_movements').insert({ session_id: session.id, type: moveType, montant: moveMontant, motif: moveMotif, created_by: user?.id });
    if (error) { toast.error(error.message); return; }
    await logActivity('cash_movement', 'cash_movements', session.id, { type: moveType, montant: moveMontant });
    toast.success('Mouvement ajouté'); setOpenMove(false); setMoveMontant(0); setMoveMotif(''); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Caisse</h1>
        <p className="text-muted-foreground text-sm">Sessions, mouvements, ouverture/clôture</p>
      </div>

      {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !session ? (
        <Card><CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><PiggyBank className="h-8 w-8 text-primary" /></div>
          <h2 className="font-heading text-lg font-semibold mb-2">Aucune session ouverte</h2>
          <p className="text-sm text-muted-foreground mb-4">Ouvrez une session de caisse pour commencer la journée.</p>
          <Button onClick={() => setOpenInit(true)}><Unlock className="h-4 w-4 mr-2" /> Ouvrir la caisse</Button>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Ouverture</p><p className="text-xl font-bold">{fcfa(session.solde_ouverture)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Entrées</p><p className="text-xl font-bold text-green-600">+{fcfa(totalEntrees)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Sorties</p><p className="text-xl font-bold text-destructive">-{fcfa(totalSorties)}</p></CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Solde théorique</p><p className="text-xl font-bold text-primary">{fcfa(theorique)}</p></CardContent></Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setOpenMove(true)} variant="outline"><Plus className="h-4 w-4 mr-2" /> Mouvement</Button>
            <Button onClick={() => { setSoldeReel(theorique); setOpenClose(true); }} variant="default"><Lock className="h-4 w-4 mr-2" /> Fermer la caisse</Button>
            <p className="text-sm text-muted-foreground self-center ml-auto">Ouverte par {session.ouverte_par_nom} le {shortDateTime(session.ouverte_le)}</p>
          </div>

          <Card><CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50 text-left"><th className="p-4 font-medium text-muted-foreground">Heure</th><th className="p-4 font-medium text-muted-foreground">Type</th><th className="p-4 font-medium text-muted-foreground">Motif</th><th className="p-4 font-medium text-muted-foreground text-right">Montant</th></tr></thead>
              <tbody>{movements.map(m => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="p-4">{new Date(m.created_at).toLocaleTimeString('fr-FR')}</td>
                  <td className="p-4">{m.type === 'entree' ? <span className="flex items-center gap-1 text-green-600"><ArrowDownCircle className="h-4 w-4" /> Entrée</span> : <span className="flex items-center gap-1 text-destructive"><ArrowUpCircle className="h-4 w-4" /> Sortie</span>}</td>
                  <td className="p-4">{m.motif}</td>
                  <td className={`p-4 text-right font-medium ${m.type === 'entree' ? 'text-green-600' : 'text-destructive'}`}>{m.type === 'entree' ? '+' : '-'}{fcfa(m.montant)}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Aucun mouvement</td></tr>}
              </tbody>
            </table></div>
          </CardContent></Card>
        </>
      )}

      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Historique des sessions</h2>
        <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50 text-left"><th className="p-4 font-medium text-muted-foreground">Ouverte</th><th className="p-4 font-medium text-muted-foreground">Fermée</th><th className="p-4 font-medium text-muted-foreground">Théorique</th><th className="p-4 font-medium text-muted-foreground">Réel</th><th className="p-4 font-medium text-muted-foreground">Écart</th></tr></thead>
          <tbody>{history.map(s => (
            <tr key={s.id} className="border-b border-border last:border-0">
              <td className="p-4">{shortDateTime(s.ouverte_le)}</td>
              <td className="p-4">{s.fermee_le ? shortDateTime(s.fermee_le) : '—'}</td>
              <td className="p-4">{fcfa(s.solde_theorique)}</td>
              <td className="p-4">{fcfa(s.solde_reel)}</td>
              <td className={`p-4 font-medium ${Number(s.ecart) === 0 ? '' : Number(s.ecart) > 0 ? 'text-green-600' : 'text-destructive'}`}>{fcfa(s.ecart)}</td>
            </tr>
          ))}
          {history.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun historique</td></tr>}
          </tbody>
        </table></div></CardContent></Card>
      </div>

      <Dialog open={openInit} onOpenChange={setOpenInit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ouvrir la caisse</DialogTitle></DialogHeader>
          <div><Label>Solde d'ouverture (FCFA)</Label><Input type="number" value={solde} onChange={e => setSolde(+e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenInit(false)}>Annuler</Button><Button onClick={openSession}>Ouvrir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openClose} onOpenChange={setOpenClose}>
        <DialogContent>
          <DialogHeader><DialogTitle>Clôturer la caisse</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm space-y-1 bg-muted p-3 rounded">
              <div className="flex justify-between"><span>Solde théorique</span><span className="font-medium">{fcfa(theorique)}</span></div>
            </div>
            <div><Label>Solde réel compté (FCFA)</Label><Input type="number" value={soldeReel} onChange={e => setSoldeReel(+e.target.value)} /></div>
            <div className="text-sm">Écart : <span className={`font-bold ${soldeReel - theorique === 0 ? '' : soldeReel - theorique > 0 ? 'text-green-600' : 'text-destructive'}`}>{fcfa(soldeReel - theorique)}</span></div>
            <div><Label>Notes</Label><Textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenClose(false)}>Annuler</Button><Button onClick={closeSession}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMove} onOpenChange={setOpenMove}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau mouvement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Type</Label>
              <Select value={moveType} onValueChange={(v: any) => setMoveType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="entree">Entrée</SelectItem><SelectItem value="sortie">Sortie</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Montant (FCFA)</Label><Input type="number" value={moveMontant} onChange={e => setMoveMontant(+e.target.value)} /></div>
            <div><Label>Motif</Label><Input value={moveMotif} onChange={e => setMoveMotif(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenMove(false)}>Annuler</Button><Button onClick={addMovement}>Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
