import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCountdown, type FlashSale } from '@/hooks/useFlashSale';

export default function FlashSaleBanner({
  flashSale,
  prixOriginal,
}: {
  flashSale: FlashSale;
  prixOriginal: number;
}) {
  const [countdown, setCountdown] = useState(() => formatCountdown(flashSale.date_fin));

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(flashSale.date_fin)), 1000);
    return () => clearInterval(id);
  }, [flashSale.date_fin]);

  const restant = Math.max(0, flashSale.stock_initial - flashSale.stock_vendu);
  const venduPct = Math.min(100, (flashSale.stock_vendu / flashSale.stock_initial) * 100);
  const remise = prixOriginal > flashSale.prix_flash
    ? Math.round((1 - flashSale.prix_flash / prixOriginal) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border-2 border-destructive/80 bg-card overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 text-xs md:text-sm font-semibold">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="h-3.5 w-3.5 shrink-0 fill-current" />
          <span className="truncate">{flashSale.titre}</span>
        </div>
        <div className="shrink-0 tabular-nums">
          Temps restant : <span className="font-mono">{countdown}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg md:text-xl font-bold text-foreground">
            {flashSale.prix_flash.toLocaleString('fr-FR')} FCFA
          </span>
          {remise > 0 && (
            <>
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                {prixOriginal.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-[10px] md:text-xs font-semibold bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded">
                -{remise}%
              </span>
            </>
          )}
        </div>

        <div className="mt-1.5">
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${venduPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
            {restant > 0 ? `${restant} articles restants` : 'Bientôt épuisé !'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
