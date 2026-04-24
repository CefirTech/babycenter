import SEO from '@/components/SEO';

export default function MentionsLegalesPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Mentions légales" description="Informations légales de BABYCENTER." />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Mentions légales</h1>
      <div className="space-y-4 text-foreground/80">
        <div><h2 className="font-heading text-lg font-semibold text-foreground">Éditeur</h2><p>BABYCENTER — Boutique de vêtements pour enfants<br />Abidjan Palmeraie Marché, Côte d'Ivoire</p></div>
        <div><h2 className="font-heading text-lg font-semibold text-foreground">Contact</h2><p>WhatsApp : (+225) 01 51 31 06 06<br />Email : contact@babycenter.ci</p></div>
        <div><h2 className="font-heading text-lg font-semibold text-foreground">Hébergement</h2><p>Site hébergé sur une infrastructure cloud sécurisée.</p></div>
        <div><h2 className="font-heading text-lg font-semibold text-foreground">Propriété intellectuelle</h2><p>L'ensemble du contenu (textes, images, logos) est la propriété exclusive de BABYCENTER. Toute reproduction est interdite sans autorisation.</p></div>
      </div>
    </div>
  );
}
