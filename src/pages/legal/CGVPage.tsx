import SEO from '@/components/SEO';

export default function CGVPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Conditions générales de vente" description="CGV de BABYCENTER, boutique de vêtements enfants en Côte d'Ivoire." />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Conditions générales de vente</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-foreground/80">
        <h2 className="font-heading text-xl font-semibold text-foreground">1. Objet</h2>
        <p>Les présentes CGV régissent les ventes conclues entre BABYCENTER, sis à Abidjan Palmeraie Marché, Côte d'Ivoire, et toute personne physique majeure souhaitant procéder à un achat sur le site babycenter.lovable.app.</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">2. Produits</h2>
        <p>Les produits proposés sont des vêtements et accessoires pour enfants de 0 à 16 ans. Les photographies n'ont pas de valeur contractuelle.</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">3. Prix</h2>
        <p>Les prix sont indiqués en Francs CFA (FCFA), toutes taxes comprises. Les frais de livraison sont indiqués au moment de la validation de la commande.</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">4. Commande et paiement</h2>
        <p>Le paiement s'effectue à la livraison (espèces) ou via Mobile Money (Orange Money, Wave, MTN, Moov).</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">5. Livraison</h2>
        <p>La livraison s'effectue sous 24-72h à Abidjan et 3-5 jours pour l'intérieur du pays.</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">6. Droit de rétractation</h2>
        <p>Conformément à l'usage, vous disposez de 7 jours à compter de la livraison pour échanger ou retourner un article non utilisé et non lavé, dans son emballage d'origine.</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">7. Service client</h2>
        <p>WhatsApp : (+225) 01 51 31 06 06 — Email : contact@babycenter.ci</p>
        <p className="text-xs text-muted-foreground mt-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  );
}
