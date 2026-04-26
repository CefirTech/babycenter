import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, CheckCircle2, Loader2, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import orangeMoneyLogo from '@/assets/payments/orange-money.png';
import waveLogo from '@/assets/payments/wave.png';
import mtnMoneyLogo from '@/assets/payments/mtn-money.png';
import moovMoneyLogo from '@/assets/payments/moov-money.png';

const PAIEMENTS = [
  { id: 'orange_money', label: 'Orange Money', logo: orangeMoneyLogo },
  { id: 'wave', label: 'Wave', logo: waveLogo },
  { id: 'mtn_money', label: 'MTN Money', logo: mtnMoneyLogo },
  { id: 'moov_money', label: 'Moov Money', logo: moovMoneyLogo },
  { id: 'especes', label: 'Espèces à la livraison', logo: null },
] as const;

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '', telephone: '', adresse: '', ville: 'Abidjan', notes: '',
    mode_paiement: 'orange_money' as typeof PAIEMENTS[number]['id'],
  });

  // Pré-remplissage depuis profil + adresse par défaut
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: addr }] = await Promise.all([
        supabase.from('profiles').select('display_name, telephone').eq('user_id', user.id).maybeSingle(),
        supabase.from('customer_addresses').select('*').eq('user_id', user.id).order('par_defaut', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setForm(f => ({
        ...f,
        nom: f.nom || addr?.destinataire || prof?.display_name || '',
        telephone: f.telephone || addr?.telephone || prof?.telephone || '',
        adresse: f.adresse || addr?.adresse || '',
        ville: addr?.ville || f.ville,
      }));
    })();
  }, [user]);

  if (items.length === 0 && !done) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Votre panier est vide</p>
        <Link to="/boutique"><Button>Aller à la boutique</Button></Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.telephone || !form.adresse) {
      toast({ title: 'Champs requis', description: 'Nom, téléphone et adresse sont obligatoires', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_nom: form.nom,
          customer_telephone: form.telephone,
          customer_adresse: `${form.adresse}, ${form.ville}`,
          canal: 'site',
          mode_paiement: form.mode_paiement,
          sous_total: total,
          total,
          notes: form.notes || null,
          user_id: user?.id ?? null,
        })
        .select('id, numero_commande')
        .single();

      if (error) throw error;

      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        variant_id: i.variant.id,
        product_nom: i.product.nom,
        taille: i.variant.taille,
        couleur: i.variant.couleur,
        prix_unitaire: i.product.prix_promo ?? i.product.prix_vente,
        quantite: i.quantite,
        total: (i.product.prix_promo ?? i.product.prix_vente) * i.quantite,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      setDone(order.numero_commande);
      clearCart();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message ?? 'Impossible de créer la commande', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="container py-20 max-w-md text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-muted-foreground mb-1">Numéro de commande</p>
        <p className="font-mono text-lg font-semibold mb-6">{done}</p>
        <p className="text-sm text-muted-foreground mb-8">
          Nous vous contacterons rapidement au {form.telephone} pour confirmer votre commande et organiser la livraison.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/boutique')}>Continuer mes achats</Button>
          <Button variant="outline" onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-4xl">
        <Link to="/panier" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour au panier
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Finaliser ma commande</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-4">Informations de livraison</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input id="nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="tel">Téléphone *</Label>
                  <Input id="tel" type="tel" placeholder="+225 ..." value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input id="ville" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="adresse">Adresse de livraison *</Label>
                  <Input id="adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea id="notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-4">Mode de paiement</h2>
              <RadioGroup value={form.mode_paiement} onValueChange={v => setForm({ ...form, mode_paiement: v as any })} className="grid sm:grid-cols-2 gap-3">
                {PAIEMENTS.map(p => {
                  const selected = form.mode_paiement === p.id;
                  return (
                    <label
                      key={p.id}
                      htmlFor={p.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}
                    >
                      <RadioGroupItem value={p.id} id={p.id} />
                      <div className="flex items-center justify-center w-12 h-12 rounded-md bg-background border border-border shrink-0 overflow-hidden">
                        {p.logo ? (
                          <img src={p.logo} alt={p.label} width={48} height={48} loading="lazy" className="object-contain w-full h-full" />
                        ) : (
                          <Banknote className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{p.label}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </section>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-heading text-lg font-semibold mb-4">Récapitulatif</h2>
            <div className="space-y-2 text-sm mb-4">
              {items.map(i => (
                <div key={i.variant.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground line-clamp-1">{i.product.nom} × {i.quantite}</span>
                  <span className="shrink-0">{((i.product.prix_promo ?? i.product.prix_vente) * i.quantite).toLocaleString('fr-FR')} F</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-semibold text-lg mb-6">
              <span>Total</span><span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Traitement...</> : 'Confirmer la commande'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
