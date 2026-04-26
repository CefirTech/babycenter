import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const items = [
  'Livraison express',
  'Qualité premium',
  'Made for kids',
  'Paiement à la livraison',
  'Mobile Money',
  '0–16 ans',
  'WhatsApp 24/7',
  'Nouveautés chaque semaine',
];

export default function FeatureMarquee() {
  // Duplicate the list so the loop seamlessly continues
  const loop = [...items, ...items];

  return (
    <section className="relative py-6 bg-foreground text-background overflow-hidden border-y border-foreground/20">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {loop.map((label, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-heading italic text-xl md:text-2xl tracking-wide">
              {label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
