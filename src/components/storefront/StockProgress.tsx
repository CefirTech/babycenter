import { Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockUrgency } from '@/lib/stock-urgency';

export default function StockProgress({
  urgency,
  size = 'sm',
  showLabel = true,
}: {
  urgency: StockUrgency;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}) {
  if (!urgency.inStock) {
    return showLabel ? (
      <p className="text-xs font-medium text-destructive flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Rupture de stock
      </p>
    ) : null;
  }

  // Bar fills toward "sold" — i.e. inverse of remaining, so visually
  // the closer the bar is to full, the more urgent the message.
  const soldPct = Math.min(100, Math.max(5, 100 - urgency.remainingPct));

  const colorClass =
    urgency.level === 'critical' ? 'bg-destructive'
    : urgency.level === 'low' ? 'bg-accent'
    : urgency.level === 'medium' ? 'bg-primary/70'
    : 'bg-primary/40';

  const Icon = urgency.level === 'critical' ? Flame
    : urgency.level === 'low' ? AlertTriangle
    : CheckCircle2;

  const labelClass =
    urgency.level === 'critical' ? 'text-destructive'
    : urgency.level === 'low' ? 'text-accent-foreground'
    : 'text-muted-foreground';

  const heightClass = size === 'md' ? 'h-2' : 'h-1.5';

  return (
    <div className="space-y-1">
      <div className={cn('w-full rounded-full bg-secondary overflow-hidden', heightClass)}>
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${soldPct}%` }}
          aria-hidden="true"
        />
      </div>
      {showLabel && (
        <p className={cn('text-xs font-medium flex items-center gap-1', labelClass)}>
          <Icon className="h-3 w-3" />
          {urgency.message}
        </p>
      )}
    </div>
  );
}
