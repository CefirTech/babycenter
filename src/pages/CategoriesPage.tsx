import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStorefrontData } from '@/hooks/useStorefrontData';

export default function CategoriesPage() {
  const { categories } = useStorefrontData();

  return (
    <div className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground">Toutes nos catégories</h1>
          <p className="text-muted-foreground mt-3">Explorez l'ensemble de nos univers pour habiller vos enfants</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.4 }}
            >
              <Link to={`/boutique?cat=${cat.slug}`} className="group relative aspect-square rounded-xl overflow-hidden block">
                <img src={cat.image_url} alt={cat.nom} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-heading text-lg font-semibold text-background">{cat.nom}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
