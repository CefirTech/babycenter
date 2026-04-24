import SEO from '@/components/SEO';
import { Truck, MapPin, Clock } from 'lucide-react';

export default function LivraisonPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Livraison" description="Modalités et zones de livraison BABYCENTER en Côte d'Ivoire." />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Livraison</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Truck, t: 'Livraison rapide', d: '24-72h à Abidjan' },
          { icon: MapPin, t: 'Toute la Côte d\'Ivoire', d: 'Abidjan + intérieur' },
          { icon: Clock, t: 'Suivi WhatsApp', d: 'Mise à jour en direct' },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="bg-card border border-border rounded-xl p-4 text-center">
            <I className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">{t}</p><p className="text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <div className="space-y-4 text-foreground/80">
        <h2 className="font-heading text-lg font-semibold text-foreground">Tarifs</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Abidjan : 1 500 FCFA</li>
          <li>Intérieur : 3 000 FCFA</li>
          <li>Livraison <strong>OFFERTE</strong> dès 50 000 FCFA d'achat</li>
        </ul>
        <h2 className="font-heading text-lg font-semibold text-foreground">Délais</h2>
        <p>Abidjan : 24 à 72 heures ouvrées. Intérieur : 3 à 5 jours ouvrés selon la destination.</p>
      </div>
    </div>
  );
}
