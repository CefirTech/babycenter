import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Headphones, MessageCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useAgeRanges } from '@/hooks/useAgeRanges';
import { useSEO } from '@/hooks/useSEO';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const reviews = [
  { nom: 'Aminata K.', note: 5, text: 'Qualité exceptionnelle ! Ma fille adore ses nouvelles robes. Livraison rapide.' },
  { nom: 'Fatou D.', note: 5, text: 'Service impeccable, les vêtements sont magnifiques. Je recommande vivement.' },
  { nom: 'Marie B.', note: 4, text: 'Très belle collection, les tailles sont bien indiquées. Mes enfants sont ravis !' },
];

export default function HomePage() {
  useSEO({
    title: 'BABYCENTER — Vêtements premium enfants 0-16 ans à Abidjan',
    description: 'Collection élégante de vêtements pour enfants de 0 à 16 ans. Qualité premium, livraison rapide en Côte d\'Ivoire. Commandez via WhatsApp.',
    canonical: 'https://babycenter.lovable.app/',
  });
  const { products, categories } = useStorefrontData();
  const { ageRanges } = useAgeRanges();
  const featured = products.filter(p => p.featured || p.tags.includes('nouveau')).slice(0, 8);
  const promos = products.filter(p => p.prix_promo !== null).slice(0, 4);
  const bestsellers = products.filter(p => p.tags.includes('bestseller')).slice(0, 4);

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Catégories */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Nos catégories</h2>
            <p className="text-muted-foreground mt-2">Trouvez le look parfait pour chaque occasion</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.div key={cat.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Link to={`/boutique?cat=${cat.slug}`} className="group relative aspect-square rounded-xl overflow-hidden block">
                  <img src={cat.image_url} alt={cat.nom} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="font-heading text-lg font-semibold text-background">{cat.nom}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          {categories.length > 8 && (
            <div className="mt-8 text-center">
              <Link to="/categories">
                <Button size="lg" variant="outline" className="font-semibold px-8">
                  Voir toutes les catégories
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Nouveautés */}
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Nouveautés</h2>
              <p className="text-muted-foreground mt-1">Les dernières pièces de notre collection</p>
            </div>
            <Link to="/boutique?filtre=nouveau">
              <Button variant="outline" className="hidden md:inline-flex">Voir tout</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/boutique?filtre=nouveau"><Button variant="outline">Voir toutes les nouveautés</Button></Link>
          </div>
        </div>
      </section>

      {/* Par âge */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Par tranche d'âge</h2>
            <p className="text-muted-foreground mt-2">Trouvez les vêtements adaptés à l'âge de votre enfant</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ageRanges.slice(0, 6).map((age) => (
              <Link key={age} to={`/boutique?age=${encodeURIComponent(age)}`} className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary hover:shadow-lg transition-all group">
                <div className="text-2xl font-heading font-bold text-primary group-hover:scale-110 transition-transform">{age.split(' ')[0]}</div>
                <div className="text-sm text-muted-foreground mt-1">{age}</div>
              </Link>
            ))}
          </div>
          {ageRanges.length > 6 && (
            <div className="mt-8 text-center">
              <Link to="/tranches-age">
                <Button size="lg" variant="outline" className="font-semibold px-8">
                  Voir toutes les tranches d'âge
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Meilleures ventes */}
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Meilleures ventes</h2>
            <p className="text-muted-foreground mt-2">Les préférés de nos clientes</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {bestsellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Promos */}
      {promos.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary">Promotions</h2>
                <p className="text-muted-foreground mt-1">Profitez de nos offres exceptionnelles</p>
              </div>
              <Link to="/promotions"><Button variant="outline">Voir tout</Button></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {promos.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Avis */}
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Avis de nos clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: r.note }).map((_, j) => <Star key={j} className="h-4 w-4 fill-accent text-accent" />)}
                </div>
                <p className="text-foreground/80 mb-4 text-sm leading-relaxed">"{r.text}"</p>
                <p className="font-semibold text-sm text-foreground">{r.nom}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Livraison rapide', desc: 'Partout en Côte d\'Ivoire' },
              { icon: ShieldCheck, title: 'Paiement sécurisé', desc: 'Mobile Money & Carte bancaire' },
              { icon: Headphones, title: 'Service client', desc: 'Disponible sur WhatsApp' },
              { icon: MessageCircle, title: 'Commande WhatsApp', desc: 'Simple et rapide' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-12 bg-primary">
        <div className="container text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Besoin d'aide ?</h2>
          <p className="text-primary-foreground/80 mb-6">Contactez-nous directement sur WhatsApp pour une assistance personnalisée</p>
          <a href="https://wa.me/2250151310606" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8">
              <MessageCircle className="h-5 w-5 mr-2" /> Écrire sur WhatsApp
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
