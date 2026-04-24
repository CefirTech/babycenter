import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, CheckCircle2, Loader2, Banknote, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
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

type PromoState = { code: string; type: 'pourcentage' | 'montant_fixe'; valeur: number } | null;

export default function CheckoutPage() {
  const { items, total: subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<PromoState>(null);
  const [shipping, setShipping] = useState({ abidjan: 1500, interieur: 3000, free_threshold: 50000 });
  const [form, setForm] = useState({
    nom: '', telephone: '', adresse: '', ville: 'Abidjan', notes: '',
    mode_paiement: 'orange_money' as typeof PAIEMENTS[number]['id'],
  });

  useEffect(() => {
    supabase.from('settings').select('valeur').eq('cle', 'shipping').maybeSingle().then(({ data }) => {
      if (data?.valeur && typeof data.valeur === 'object') setShipping(prev => ({ ...prev, ...(data.valeur as any) }));
    });
  }, []);

  const isAbidjan = form.ville.toLowerCase().includes('abidjan');
  const fraisLivraison = useMemo(() => {
    if (subtotal >= shipping.free_threshold) return 0;
    return isAbidjan ? shipping.abidjan : shipping.interieur;
  }, [subtotal, isAbidjan, shipping]);

  const remise = useMemo(() => {
    if (!promo) return 0;
    return promo.type === 'pourcentage' ? Math.round(subtotal * promo.valeur / 100) : Math.min(promo.valeur, subtotal);
  }, [promo, subtotal]);

  const total = Math.max(0, subtotal - remise + fraisLivraison);

  if (items.length === 0 && !done) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Votre panier est vide</p>
        <Link to="/boutique"><Button>Aller à la boutique</Button></Link>
      </div>
    );
  }

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    const { data, error } = await supabase.rpc('validate_promo_code', { _code: promoCode.trim(), _montant: subtotal });
    if (error || !data || !data[0]) { toast({ title: 'Erreur', description: 'Code invalide', variant: 'destructive' }); return; }
    const r = data[0] as any;
    if (!r.valid) { toast({ title: 'Code refusé', description: r.reason, variant: 'destructive' }); setPromo(null); return; }
    setPromo({ code: r.code, type: r.type, valeur: Number(r.valeur) });
    toast({ title: 'Code appliqué', description: r.nom });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.telephone || !form.adresse) {
      toast({ title: 'Champs requis', description: 'Nom, téléphone et adresse sont obligatoires', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        customer_nom: form.nom,
        customer_telephone: form.telephone,
        customer_adresse: `${form.adresse}, ${form.ville}`,
        canal: 'site',
        mode_paiement: form.mode_paiement,
        sous_total: subtotal,
        frais_livraison: fraisLivraison,
        remise,
        total,
        notes: form.notes || null,
        user_id: user?.id ?? null,
      }).select('id, numero_commande').single();
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
        <SEO title="Commande confirmée" />
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-muted-foreground mb-1">Numéro de commande</p>
        <p className="font-mono text-lg font-semibold mb-6">{done}</p>
        <p className="text-sm text-muted-foreground mb-8">Nous vous contacterons rapidement au {form.telephone} pour confirmer votre commande.</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/boutique')}>Continuer mes achats</Button>
          {user && <Button variant="outline" onClick={() => navigate('/compte')}>Voir mes commandes</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <SEO title="Finaliser ma commande" />
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
                <div className="sm:col-span-2"><Label htmlFor="nom">Nom complet *</Label><Input id="nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></div>
                <div><Label htmlFor="tel">Téléphone *</Label><Input id="tel" type="tel" placeholder="+225 ..." value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} required /></div>
                <div><Label htmlFor="ville">Ville</Label><Input id="ville" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label htmlFor="adresse">Adresse de livraison *</Label><Input id="adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} required /></div>
                <div className="sm:col-span-2"><Label htmlFor="notes">Notes (optionnel)</Label><Textarea id="notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-4">Mode de paiement</h2>
              <RadioGroup value={form.mode_paiement} onValueChange={v => setForm({ ...form, mode_paiement: v as any })} className="grid sm:grid-cols-2 gap-3">
                {PAIEMENTS.map(p => {
                  const selected = form.mode_paiement === p.id;
                  return (
                    <label key={p.id} htmlFor={p.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}>
                      <RadioGroupItem value={p.id} id={p.id} />
                      <div className="flex items-center justify-center w-12 h-12 rounded-md bg-background border border-border shrink-0 overflow-hidden">
                        {p.logo ? <img src={p.logo} alt={p.label} width={48} height={48} loading="lazy" className="object-contain w-full h-full" /> : <Banknote className="h-6 w-6 text-muted-foreground" />}
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

            <div className="border-t border-border pt-3 mb-3">
              <Label htmlFor="promo" className="text-xs text-muted-foreground">Code promo</Label>
              <div className="flex gap-2 mt-1">
                <Input id="promo" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="CODE" className="h-9" />
                <Button type="button" variant="outline" size="sm" onClick={applyPromo}><Tag className="h-3.5 w-3.5" /></Button>
              </div>
              {promo && <p className="text-xs text-green-600 mt-1">✓ {promo.code} appliqué</p>}
            </div>

            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{subtotal.toLocaleString('fr-FR')} F</span></div>
              {remise > 0 && <div className="flex justify-between text-green-600"><span>Remise</span><span>−{remise.toLocaleString('fr-FR')} F</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{fraisLivraison === 0 ? 'Offerte' : `${fraisLivraison.toLocaleString('fr-FR')} F`}</span></div>
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold text-lg mb-6">
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
