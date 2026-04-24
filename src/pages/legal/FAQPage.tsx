import SEO from '@/components/SEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'Comment passer commande ?', a: 'Ajoutez vos articles au panier puis suivez le tunnel de commande. Vous pouvez aussi commander directement via WhatsApp.' },
  { q: 'Quels sont les moyens de paiement ?', a: 'Espèces à la livraison, Orange Money, Wave, MTN Money, Moov Money.' },
  { q: 'Combien coûte la livraison ?', a: '1 500 FCFA à Abidjan, 3 000 FCFA en intérieur. Gratuite dès 50 000 FCFA.' },
  { q: 'Puis-je échanger ou retourner ?', a: 'Oui, sous 7 jours après livraison, article non porté et non lavé.' },
  { q: 'Comment connaître la bonne taille ?', a: 'Consultez notre guide des tailles disponible sur chaque fiche produit ou contactez-nous via WhatsApp.' },
  { q: 'Vos articles sont-ils en stock ?', a: 'Tous les articles présentés sur le site sont en stock sauf mention contraire sur la fiche.' },
];

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Questions fréquentes" description="Réponses aux questions les plus courantes sur BABYCENTER." jsonLd={jsonLd} />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">Questions fréquentes</h1>
      <Accordion type="single" collapsible>
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`f${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
