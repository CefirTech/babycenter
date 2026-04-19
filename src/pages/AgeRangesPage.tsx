import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAgeRanges } from '@/hooks/useAgeRanges';

export default function AgeRangesPage() {
  const { ageRanges } = useAgeRanges();

  return (
    <div className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Toutes les tranches d'âge</h1>
          <p className="text-muted-foreground mt-3">Trouvez les vêtements adaptés à l'âge de votre enfant</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ageRanges.map((age, i) => (
            <motion.div
              key={age}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.4 }}
            >
              <Link
                to={`/boutique?age=${encodeURIComponent(age)}`}
                className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary hover:shadow-lg transition-all group block"
              >
                <div className="text-2xl font-heading font-bold text-primary group-hover:scale-110 transition-transform">
                  {age.split(' ')[0]}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{age}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
