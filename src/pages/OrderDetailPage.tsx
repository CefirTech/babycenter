import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin, CreditCard, Package, CheckCircle2, Truck, Clock } from 'lucide-react';
import { fcfa as formatPrice } from '@/lib/format';
import { useSEO } from '@/hooks/useSEO';

const STEPS = [
  { key: 'en_attente_paiement', label: 'En attente paiement', icon: Clock },
  { key: 'payee', label: 'Payée', icon: CheckCircle2 },
  { key: 'en_preparation', label: 'En préparation', icon: Package },
  { key: 'expediee', label: 'Expédiée', icon: Truck },
  { key: 'livree', label: 'Livrée', icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  useSEO({ title: 'Détail commande — BabyCenter' });
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: o } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      const { data: it } = await supabase.from('order_items').select('*').eq('order_id', id);
      setOrder(o);
      setItems(it ?? []);
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) return <div className="container py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!order) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground mb-4">Commande introuvable</p>
      <Link to="/compte"><Button variant="outline">Retour au compte</Button></Link>
    </div>
  );

  const currentStepIdx = STEPS.findIndex(s => s.key === order.statut);
  const isCancelled = order.statut === 'annulee';

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <Link to="/compte" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour à mes commandes
      </Link>

      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Commande {order.numero_commande}</h1>
          <p className="text-sm text-muted-foreground">
            Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isCancelled && <Badge variant="destructive">Annulée</Badge>}
      </div>

      {/* Suivi */}
      {!isCancelled && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base font-heading">Suivi de votre commande</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between items-start relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-0" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-500"
                style={{ width: currentStepIdx > 0 ? `${(currentStepIdx / (STEPS.length - 1)) * 100}%` : '0%' }}
              />
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= currentStepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${reached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={`text-xs text-center hidden sm:block ${reached ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Articles */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base font-heading">Articles ({items.length})</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {items.map(it => (
              <div key={it.id} className="py-3 flex justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm">{it.product_nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {[it.taille, it.couleur].filter(Boolean).join(' • ')} {it.taille || it.couleur ? '• ' : ''}Qté : {it.quantite}
                  </p>
                </div>
                <p className="font-semibold text-sm">{formatPrice(it.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Récap */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Livraison</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.customer_nom}</p>
              {order.customer_telephone && <p className="text-muted-foreground">{order.customer_telephone}</p>}
              {order.customer_adresse && <p className="text-muted-foreground">{order.customer_adresse}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Paiement</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="capitalize">{(order.mode_paiement ?? '').replace(/_/g, ' ') || '—'}</p>
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatPrice(order.sous_total)}</span></div>
                {order.frais_livraison > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatPrice(order.frais_livraison)}</span></div>}
                {order.remise > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span className="text-primary">-{formatPrice(order.remise)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
