import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeroBanner } from '@/hooks/useHeroBanner';
import heroImg from '@/assets/hero-main.jpg';

export default function HeroCarousel() {
  const { config } = useHeroBanner();
  const slides = config.slides;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  // Reset if slides shrink
  useEffect(() => { if (index >= slides.length) setIndex(0); }, [slides.length, index]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setTimeout(() => {
      setDirection(1);
      setIndex(i => (i + 1) % slides.length);
    }, config.interval_seconds * 1000);
    return () => clearTimeout(id);
  }, [index, slides.length, config.interval_seconds, paused]);

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex((i + slides.length) % slides.length);
  };

  const slide = slides[index] ?? slides[0];
  const heroSrc = slide.image_url || heroImg;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.6 }),
    center: { x: '0%', opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.6 }),
  };

  return (
    <section
      className="relative h-[70vh] md:h-[85vh] overflow-hidden bg-foreground/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) goTo(index + (dx < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      aria-roledescription="carousel"
    >
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.8 }, opacity: { duration: 0.4 } }}
          className="absolute inset-0"
        >
          <img
            src={heroSrc}
            alt={slide.title_main}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/60" />
          <div className="relative container h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl text-background text-center mx-auto flex flex-col items-center"
            >
              {slide.eyebrow && <p className="text-sm md:text-base uppercase tracking-[0.2em] mb-3 text-background/80 font-medium">{slide.eyebrow}</p>}
              <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-4">
                {slide.title_main} {slide.title_accent && <span className="text-accent">{slide.title_accent}</span>}
              </h1>
              {slide.subtitle && <p className="text-base md:text-lg text-background/80 mb-8 leading-relaxed">{slide.subtitle}</p>}
              <div className="flex flex-wrap gap-3 justify-center">
                {slide.cta_label && (
                  slide.cta_href.startsWith('http') ? (
                    <a href={slide.cta_href} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">{slide.cta_label}</Button>
                    </a>
                  ) : (
                    <Link to={slide.cta_href}>
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">{slide.cta_label}</Button>
                    </Link>
                  )
                )}
                {slide.show_take_button && slide.take_button_href && (
                  slide.take_button_href.startsWith('http') ? (
                    <a href={slide.take_button_href} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8">
                        {slide.take_button_label || 'Je prends'}
                      </Button>
                    </a>
                  ) : (
                    <Link to={slide.take_button_href}>
                      <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8">
                        {slide.take_button_label || 'Je prends'}
                      </Button>
                    </Link>
                  )
                )}
                {slide.show_whatsapp && (
                  <a href="https://wa.me/2250151310606" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8">
                      <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Aller à la diapositive ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-background' : 'w-2 bg-background/50 hover:bg-background/80'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
