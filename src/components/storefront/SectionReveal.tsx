import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Scroll-triggered reveal block for section headers and content. */
export default function SectionReveal({
  children,
  delay = 0,
  className = '',
  y = 30,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
