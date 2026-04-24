import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Review {
  id: string; auteur_nom: string; note: number; titre: string | null; commentaire: string; created_at: string;
}

export default function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState(5);
  const [titre, setTitre] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from('reviews').select('id, auteur_nom, note, titre, commentaire, created_at')
      .eq('product_id', productId).eq('approuve', true).order('created_at', { ascending: false });
    if (error) console.error(error);
    setReviews(data || []);
  };
  useEffect(() => { load(); }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: productId, user_id: user.id,
      auteur_nom: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Cliente',
      note, titre: titre || null, commentaire,
    });
    setLoading(false);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Merci !', description: 'Votre avis sera publié après validation' }); setShowForm(false); setCommentaire(''); setTitre(''); }
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.note, 0) / reviews.length : 0;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Avis clientes</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />)}</div>
              <span className="text-sm text-muted-foreground">{avg.toFixed(1)}/5 · {reviews.length} avis</span>
            </div>
          )}
        </div>
        {user ? (
          <Button variant="outline" onClick={() => setShowForm(s => !s)}>{showForm ? 'Annuler' : 'Donner mon avis'}</Button>
        ) : (
          <Link to="/connexion?next=/produit"><Button variant="outline">Se connecter pour donner un avis</Button></Link>
        )}
      </div>

      {showForm && user && (
        <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="text-sm font-medium block mb-2">Note</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button type="button" key={i} onClick={() => setNote(i)}>
                  <Star className={`h-6 w-6 ${i <= note ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Titre (optionnel)" value={titre} onChange={e => setTitre(e.target.value)} />
          <Textarea required minLength={10} placeholder="Partagez votre expérience..." value={commentaire} onChange={e => setCommentaire(e.target.value)} />
          <Button type="submit" disabled={loading}>Publier</Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">Soyez la première à laisser un avis sur ce produit.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{r.auteur_nom}</p>
                <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.note ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />)}</div>
              </div>
              {r.titre && <p className="font-semibold mb-1">{r.titre}</p>}
              <p className="text-sm text-foreground/80">{r.commentaire}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
