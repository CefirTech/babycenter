import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeroBanner } from '@/hooks/useHeroBanner';
import heroImg from '@/assets/hero-main.jpg';

// Pexels fallback slides when no admin slides are configured
const FALLBACK_SLIDES = [
  {
    image: 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=1600',
    eyebrow: 'Nouvelle collection',
    title_main: 'Style & confort',
    title_accent: 'pour les petits',
    subtitle: 'Des vêtements premium pour vos enfants de 0 à 16 ans',
    cta_label: 'Découvrir',
    cta_href: '/boutique',
    show_whatsapp: true,
  },
  {
    image: 'https://images.pexels.com/photos/1620653/pexels-photo-1620653.jpeg?auto=compress&cs=tinysrgb&w=1600',
    eyebrow: 'Tendances 2025',
    title_main: 'Mode enfantine',
    title_accent: 'premium',
    subtitle: 'Qualité exceptionnelle, coupes modernes et couleurs vibrantes',
    cta_label: 'Voir la boutique',
    cta_href: '/boutique',
    show_whatsapp: false,
  },
  {
    image: 'https://images.pexels.com/photos/3622614/pexels-photo-3622614.jpeg?auto=compress&cs=tinysrgb&w=1600',
    eyebrow: 'Promotions',
    title_main: "Jusqu'à -40%",
    title_accent: 'sur la sélection',
    subtitle: 'Profitez de nos offres exclusives sur les meilleures pièces de la saison',
    cta_label: 'Voir les promos',
    cta_href: '/promotions',
    show_whatsapp: true,
  },
  {
    image: 'https://images.pexels.com/photos/5693889/pexels-photo-5693889.jpeg?auto=compress&cs=tinysrgb&w=1600',
    eyebrow: 'Filles 4-12 ans',
    title_main: 'Robes & tenues',
    title_accent: 'de fête',
    subtitle: 'Pour chaque occasion, une tenue qui fait briller votre enfant',
    cta_label: 'Explorer',
    cta_href: '/boutique',
    show_whatsapp: false,
  },
];

type SlideData = {
  image: string;
  eyebrow?: string;
  title_main: string;
  title_accent?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href: string;
  show_whatsapp?: boolean;
};

export default function HeroCarousel() {
  const { config } = useHeroBanner();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [3, -3]);
  const rotateY = useTransform(mouseX, [-600, 600], [-3, 3]);

  // Merge admin slides (if configured) with fallback images
  const slides: SlideData[] = config.slides.length > 0
    ? config.slides.map((s, i) => ({
        image: s.image_url || FALLBACK_SLIDES[i % FALLBACK_SLIDES.length].image,
        eyebrow: s.eyebrow,
        title_main: s.title_main,
        title_accent: s.title_accent,
        subtitle: s.subtitle,
        cta_label: s.cta_label,
        cta_href: s.cta_href || '/boutique',
        show_whatsapp: s.show_whatsapp,
      }))
    : FALLBACK_SLIDES;

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  const goTo = useCallback((i: number) => {
    const next = (i + slides.length) % slides.length;
    setDirection(i > index ? 1 : -1);
    setIndex(next);
  }, [index, slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setTimeout(() => {
      setDirection(1);
      setIndex(i => (i + 1) % slides.length);
    }, config.interval_seconds * 1000);
    return () => clearTimeout(id);
  }, [index, slides.length, config.interval_seconds, paused]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setPaused(false);
  };

  const slide = slides[index] ?? slides[0];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, scale: 1.05 }),
    center: { x: '0%', opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-25%' : '25%', opacity: 0, scale: 0.97 }),
  };

  const textVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.25 + i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <section
      className="relative h-[75vh] md:h-[92vh] overflow-hidden bg-neutral-900 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) goTo(index + (dx < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      aria-roledescription="carousel"
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={index}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.9 }, opacity: { duration: 0.5 }, scale: { duration: 0.9 } }}
          className="absolute inset-0"
        >
          {/* Image with mouse-parallax */}
          <motion.div className="absolute inset-0 scale-105" style={{ rotateX, rotateY, transformPerspective: 1400 }}>
            <img
              src={slide.image}
              alt={slide.title_main}
              fetchPriority={index === 0 ? 'high' : 'low'}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center"
              width={1600}
              height={900}
            />
          </motion.div>

          {/* Gradient layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Text content */}
          <div className="relative container h-full flex items-center">
            <div className="max-w-lg md:max-w-2xl">
              {slide.eyebrow && (
                <motion.p
                  custom={0}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-xs md:text-sm uppercase tracking-[0.28em] mb-4 text-white/65 font-semibold"
                >
                  — {slide.eyebrow}
                </motion.p>
              )}
              <motion.h1
                custom={1}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="font-heading text-4xl md:text-6xl lg:text-7xl font-black leading-[1.02] mb-5 text-white"
              >
                {slide.title_main}{' '}
                {slide.title_accent && <span className="text-accent italic">{slide.title_accent}</span>}
              </motion.h1>
              {slide.subtitle && (
                <motion.p
                  custom={2}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-sm md:text-base text-white/70 mb-8 leading-relaxed max-w-md"
                >
                  {slide.subtitle}
                </motion.p>
              )}
              <motion.div
                custom={3}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-3"
              >
                {slide.cta_label && (
                  slide.cta_href.startsWith('http') ? (
                    <a href={slide.cta_href} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-xl shadow-primary/40 text-sm md:text-base h-12">
                        {slide.cta_label}
                      </Button>
                    </a>
                  ) : (
                    <Link to={slide.cta_href}>
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-xl shadow-primary/40 text-sm md:text-base h-12">
                        {slide.cta_label}
                      </Button>
                    </Link>
                  )
                )}
                {slide.show_whatsapp && (
                  <a href="https://wa.me/2250151310606" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="border-white/35 text-white hover:bg-white/15 font-semibold px-7 backdrop-blur-sm text-sm md:text-base h-12">
                      <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <motion.button
            onClick={() => goTo(index - 1)}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.93 }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-13 md:h-13 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={() => goTo(index + 1)}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.93 }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-13 md:h-13 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </>
      )}

      {/* Thumbnail strip */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-end gap-2.5">
          {slides.map((s, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Diapositive ${i + 1}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              animate={{ opacity: i === index ? 1 : 0.55, y: i === index ? -2 : 0 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-lg border-2 transition-all duration-300 shadow-lg"
              style={{ borderColor: i === index ? 'white' : 'rgba(255,255,255,0.2)' }}
            >
              <img
                src={s.image}
                alt=""
                className="w-14 h-10 md:w-20 md:h-14 object-cover block"
              />
              {i === index && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: config.interval_seconds, ease: 'linear' }}
                  key={`progress-${index}`}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Counter badge */}
      <div className="absolute top-5 right-5 z-20 hidden md:flex items-center gap-1.5 bg-black/35 backdrop-blur-sm rounded-full px-3.5 py-1.5">
        <span className="text-white font-bold text-sm tabular-nums">{String(index + 1).padStart(2, '0')}</span>
        <span className="text-white/40 text-xs">/</span>
        <span className="text-white/55 text-sm tabular-nums">{String(slides.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
}
