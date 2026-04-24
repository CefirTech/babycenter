import SEO from '@/components/SEO';

export default function ConfidentialitePage() {
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Politique de confidentialité" description="Comment BABYCENTER protège vos données personnelles." />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Politique de confidentialité</h1>
      <div className="space-y-4 text-foreground/80">
        <p>Cette politique décrit la manière dont BABYCENTER collecte, utilise et protège les données personnelles que vous nous fournissez lors de l'utilisation de notre site.</p>
        <h2 className="font-heading text-lg font-semibold text-foreground">Données collectées</h2>
        <p>Nom, téléphone, adresse de livraison et email lors d'une commande ou inscription. Ces données sont strictement utilisées pour traiter votre commande et vous tenir informée.</p>
        <h2 className="font-heading text-lg font-semibold text-foreground">Cookies</h2>
        <p>Nous utilisons des cookies essentiels au fonctionnement du panier et de l'authentification, ainsi que des cookies de mesure d'audience anonymes.</p>
        <h2 className="font-heading text-lg font-semibold text-foreground">Vos droits</h2>
        <p>Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données en nous contactant à contact@babycenter.ci.</p>
        <h2 className="font-heading text-lg font-semibold text-foreground">Conservation</h2>
        <p>Les données de commande sont conservées 3 ans à des fins comptables. Les comptes inactifs sont supprimés après 3 ans sans connexion.</p>
      </div>
    </div>
  );
}
