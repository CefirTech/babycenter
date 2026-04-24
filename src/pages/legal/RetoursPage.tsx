import SEO from '@/components/SEO';

export default function RetoursPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Retours et échanges" description="Politique de retours et d'échanges chez BABYCENTER." />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Retours & échanges</h1>
      <div className="space-y-4 text-foreground/80">
        <p>Nous voulons que votre enfant soit ravie de chaque vêtement choisi. Si ce n'est pas le cas, vous disposez de <strong>7 jours</strong> à compter de la livraison pour échanger ou retourner un article.</p>
        <h2 className="font-heading text-lg font-semibold text-foreground">Conditions</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Article non porté, non lavé, étiquettes intactes</li>
          <li>Emballage d'origine</li>
          <li>Bon de commande joint</li>
        </ul>
        <h2 className="font-heading text-lg font-semibold text-foreground">Comment retourner ?</h2>
        <p>Contactez-nous via WhatsApp au (+225) 01 51 31 06 06 pour organiser le retour. Les frais de retour restent à votre charge sauf erreur de notre part.</p>
        <h2 className="font-heading text-lg font-semibold text-foreground">Remboursement</h2>
        <p>Le remboursement (Mobile Money ou avoir) est effectué sous 5 jours ouvrés après réception et contrôle de l'article.</p>
      </div>
    </div>
  );
}
