import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Heart, Package, Smile, Truck } from 'lucide-react';

const stats = [
  { icon: Smile, value: 5000, suffix: '+', label: 'Clients heureux' },
  { icon: Package, value: 1200, suffix: '+', label: 'Articles disponibles' },
  { icon: Truck, value: 24, suffix: 'h', label: 'Livraison Abidjan' },
  { icon: Heart, value: 99, suffix: '%', label: 'Satisfaction' },
];

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="font-heading text-4xl md:text-5xl font-bold text-primary tabular-nums">
      {val.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

export default function StatsStrip() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Floating decorative shapes */}
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map(({ icon: Icon, value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                className="mx-auto w-14 h-14 rounded-2xl bg-card border border-border shadow-md flex items-center justify-center mb-4"
              >
                <Icon className="h-6 w-6 text-primary" />
              </motion.div>
              <div className="leading-none">
                <Counter to={value} suffix={suffix} />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest mt-2 font-medium">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
