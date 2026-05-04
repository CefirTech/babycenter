import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { Truck, ShieldCheck, Headphones, MessageCircle, Star, ArrowRight, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import SectionReveal from '@/components/storefront/SectionReveal';
import StatsStrip from '@/components/storefront/StatsStrip';
import FeatureMarquee from '@/components/storefront/FeatureMarquee';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import { useAgeRanges } from '@/hooks/useAgeRanges';
import { useSEO } from '@/hooks/useSEO';

const reviews = [
  { nom: 'Aminata K.', note: 5, text: 'Qualité exceptionnelle ! Ma fille adore ses nouvelles robes. Livraison rapide.' },
  { nom: 'Fatou D.', note: 5, text: 'Service impeccable, les vêtements sont magnifiques. Je recommande vivement.' },
  { nom: 'Marie B.', note: 4, text: 'Très belle collection, les tailles sont bien indiquées. Mes enfants sont ravis !' },
];

const ageColors = [
  { bg: 'bg-rose-50 border-rose-200 hover:border-rose-400', text: 'text-rose-500', glow: 'hover:shadow-rose-100' },
  { bg: 'bg-sky-50 border-sky-200 hover:border-sky-400', text: 'text-sky-500', glow: 'hover:shadow-sky-100' },
  { bg: 'bg-amber-50 border-amber-200 hover:border-amber-400', text: 'text-amber-500', glow: 'hover:shadow-amber-100' },
  { bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', text: 'text-emerald-500', glow: 'hover:shadow-emerald-100' },
  { bg: 'bg-orange-50 border-orange-200 hover:border-orange-400', text: 'text-orange-500', glow: 'hover:shadow-orange-100' },
  { bg: 'bg-teal-50 border-teal-200 hover:border-teal-400', text: 'text-teal-500', glow: 'hover:shadow-teal-100' },
];

function CategoryCard({ cat, index }: { cat: { id: string; nom: string; slug: string; image_url: string }; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ transformStyle: 'preserve-3d' }}
      whileHover={{ scale: 1.04, y: -6 }}
    >
      <Link to={`/boutique?cat=${cat.slug}`} className="group relative aspect-square rounded-2xl overflow-hidden block shadow-md">
        <motion.img
          src={cat.image_url}
          alt={cat.nom}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.12 : 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          animate={{ opacity: hovered ? 1 : 0.7 }}
          transition={{ duration: 0.4 }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4"
          animate={{ y: hovered ? 0 : 4 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-heading text-lg font-bold text-white">{cat.nom}</h3>
          <motion.div
            className="flex items-center gap-1 text-white/80 text-xs mt-1 font-medium"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
            transition={{ duration: 0.25 }}
          >
            Voir la collection <ArrowRight className="h-3 w-3" />
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute inset-0 ring-2 ring-white/40 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </Link>
    </motion.div>
  );
}

function AgeCard({ age, index }: { age: string; index: number }) {
  const colors = ageColors[index % ageColors.length];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ scale: 1.08, y: -6 }}
      whileTap={{ scale: 0.96 }}
    >
      <Link
        to={`/boutique?age=${encodeURIComponent(age)}`}
        className={`flex flex-col items-center justify-center rounded-2xl p-5 border-2 transition-all duration-300 shadow-sm hover:shadow-lg ${colors.bg} ${colors.glow}`}
      >
        <motion.span
          className={`text-2xl font-heading font-black leading-none ${colors.text}`}
          whileHover={{ rotate: [-2, 2, -2, 0] }}
          transition={{ duration: 0.4 }}
        >
          {age.split(' ')[0]}
        </motion.span>
        <span className="text-xs text-foreground/60 mt-1.5 font-medium text-center leading-tight">{age}</span>
      </Link>
    </motion.div>
  );
}

function ReviewCard({ r, i }: { r: typeof reviews[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)' }}
      className="bg-card rounded-2xl p-6 border border-border relative overflow-hidden"
    >
      <motion.div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/5"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, delay: i * 1.2 }}
      />
      <div className="flex gap-1 mb-3">
        {Array.from({ length: r.note }).map((_, j) => (
          <motion.div
            key={j}
            initial={{ scale: 0, rotate: -30 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 + j * 0.06, type: 'spring', stiffness: 300 }}
          >
            <Star className="h-4 w-4 fill-accent text-accent" />
          </motion.div>
        ))}
      </div>
      <p className="text-foreground/80 mb-4 text-sm leading-relaxed italic">"{r.text}"</p>
      <p className="font-semibold text-sm text-foreground">— {r.nom}</p>
    </motion.div>
  );
}

function PromoBanner({ promos }: { promos: ReturnType<typeof useStorefrontData>['products'] }) {
  const [active, setActive] = useState(0);
  const product = promos[active];
  if (!product) return null;
  const discount = Math.round((1 - product.prix_promo! / product.prix_vente) * 100);

  return (
    <section className="py-16 md:py-20 bg-foreground text-background overflow-hidden relative">
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--accent)) 0%, transparent 60%), radial-gradient(circle at 70% 50%, hsl(var(--primary)) 0%, transparent 60%)' }}
        animate={{ opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl -translate-y-1/2"
        animate={{ x: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="container relative">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-accent/20 text-accent border border-accent/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-6"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="h-4 w-4" /> Offres spéciales
            </motion.div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-4">
              Jusqu'à <span className="text-accent">-{discount}%</span><br />sur nos articles
            </h2>
            <p className="text-background/70 mb-8 text-lg leading-relaxed">
              Profitez de nos promotions exclusives sur une sélection de vêtements premium pour enfants.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/promotions">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 shadow-lg shadow-accent/30">
                  <Gift className="h-4 w-4 mr-2" /> Voir les promos
                </Button>
              </Link>
              <Link to="/boutique">
                <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 font-semibold px-8">
                  Boutique
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="relative h-72 md:h-96">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.9, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -40 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl">
                  <img src={product.images[0]} alt={product.nom} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <motion.div
                    className="absolute top-4 right-4 bg-accent text-accent-foreground font-black text-2xl w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    -{discount}%
                  </motion.div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-heading font-bold text-lg leading-tight">{product.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-accent font-bold text-xl">{product.prix_promo!.toLocaleString('fr-FR')} F</span>
                      <span className="text-white/60 line-through text-sm">{product.prix_vente.toLocaleString('fr-FR')} F</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* dots */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {promos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-accent' : 'w-2 bg-background/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  useSEO({
    title: 'BABYCENTER — Vêtements premium enfants 0-16 ans à Abidjan',
    description: "Collection élégante de vêtements pour enfants de 0 à 16 ans. Qualité premium, livraison rapide en Côte d'Ivoire.",
    canonical: 'https://babycenter.lovable.app/',
  });

  const { products, categories } = useStorefrontData();
  const { ageRanges } = useAgeRanges();
  const featured = products.filter(p => p.featured || p.tags.includes('nouveau')).slice(0, 8);
  const promos = products.filter(p => p.prix_promo !== null).slice(0, 4);
  const bestsellers = products.filter(p => p.tags.includes('bestseller') || p.featured).slice(0, 4);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const smoothY = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const parallaxY = useTransform(smoothY, [0, 1], ['0%', '8%']);

  return (
    <div ref={containerRef}>
      {/* Hero */}
      <motion.div style={{ y: parallaxY }}>
        <HeroCarousel />
      </motion.div>

      {/* Marquee */}
      <FeatureMarquee />

      {/* Stats */}
      <StatsStrip />

      {/* Catégories */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="container">
          <SectionReveal className="text-center mb-12">
            <motion.span
              className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Collections
            </motion.span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Nos catégories</h2>
            <p className="text-muted-foreground mt-3 text-lg">Trouvez le look parfait pour chaque occasion</p>
          </SectionReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {categories.slice(0, 8).map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
          {categories.length > 8 && (
            <motion.div
              className="mt-10 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/categories">
                <Button size="lg" variant="outline" className="font-semibold px-8 group">
                  Voir toutes les catégories
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Nouveautés */}
      <section className="py-16 md:py-24 bg-secondary/40 relative overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="container relative">
          <SectionReveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <motion.span
                className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3"
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                Arrivages frais
              </motion.span>
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Nouveautés</h2>
              <p className="text-muted-foreground mt-2 text-base">Les dernières pièces de notre collection</p>
            </div>
            <Link to="/boutique?filtre=nouveau" className="hidden md:block">
              <Button variant="outline" className="group">
                Voir tout <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </SectionReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/boutique?filtre=nouveau">
              <Button variant="outline" className="group">
                Voir toutes les nouveautés <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Par âge */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="container">
          <SectionReveal className="text-center mb-12">
            <motion.span
              className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Adapté à chaque enfant
            </motion.span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Par tranche d'âge</h2>
            <p className="text-muted-foreground mt-3 text-base">Trouvez les vêtements adaptés à l'âge de votre enfant</p>
          </SectionReveal>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {ageRanges.slice(0, 6).map((age, i) => (
              <AgeCard key={age} age={age} index={i} />
            ))}
          </div>
          {ageRanges.length > 6 && (
            <div className="mt-10 text-center">
              <Link to="/tranches-age">
                <Button size="lg" variant="outline" className="font-semibold px-8 group">
                  Voir toutes les tranches d'âge
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Promo banner */}
      {promos.length > 0 && <PromoBanner promos={promos} />}

      {/* Meilleures ventes */}
      {bestsellers.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container">
            <SectionReveal className="text-center mb-12">
              <motion.span
                className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Coup de coeur
              </motion.span>
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Meilleures ventes</h2>
              <p className="text-muted-foreground mt-3">Les préférés de nos clientes</p>
            </SectionReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestsellers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Avis */}
      <section className="py-16 md:py-24 bg-secondary/40 relative overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent/5 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="container relative">
          <SectionReveal className="text-center mb-12">
            <motion.span
              className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Elles nous font confiance
            </motion.span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Avis de nos clientes</h2>
          </SectionReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r, i) => <ReviewCard key={i} r={r} i={i} />)}
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              { icon: Truck, title: 'Livraison rapide', desc: "Partout en Côte d'Ivoire" },
              { icon: ShieldCheck, title: 'Paiement sécurisé', desc: 'Mobile Money & Carte bancaire' },
              { icon: Headphones, title: 'Service client', desc: 'Disponible sur WhatsApp' },
              { icon: MessageCircle, title: 'Commande WhatsApp', desc: 'Simple et rapide' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                  className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm"
                >
                  <Icon className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="font-semibold text-sm md:text-base text-foreground">{title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <motion.section
        className="py-14 bg-gradient-to-r from-green-600 to-green-500 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)' }}
          animate={{ opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <div className="container text-center relative">
          <motion.h2
            className="font-heading text-2xl md:text-4xl font-bold text-white mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Besoin d'aide ?
          </motion.h2>
          <motion.p
            className="text-white/85 mb-8 text-base md:text-lg"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Contactez-nous directement sur WhatsApp pour une assistance personnalisée
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a href="https://wa.me/2250151310606" target="_blank" rel="noopener noreferrer">
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl shadow-xl text-base cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" /> Écrire sur WhatsApp
              </motion.div>
            </a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
