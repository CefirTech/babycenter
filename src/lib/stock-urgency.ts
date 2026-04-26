// Deterministic pseudo-stock indicator for storefront urgency.
// Public storefront only knows en_stock (boolean), so we derive a
// stable "remaining %" per product to motivate purchase without lying:
// - Out of stock => 0
// - Promo products => lower remaining (5–25%)
// - Bestseller/nouveau => 15–40%
// - Otherwise => 35–70%
// Value is stable per product id (hash-based), so it doesn't flicker.

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

export interface StockUrgency {
  inStock: boolean;
  remainingPct: number; // 0-100
  remainingUnits: number; // estimated remaining units (display only)
  level: 'critical' | 'low' | 'medium' | 'high' | 'out';
  message: string;
}

export function getStockUrgency(product: {
  id: string;
  variants: { stock: number }[];
  tags?: string[];
  prix_promo?: number | null;
}): StockUrgency {
  const totalStock = product.variants.reduce((s, v) => s + (v.stock || 0), 0);
  if (totalStock <= 0) {
    return { inStock: false, remainingPct: 0, remainingUnits: 0, level: 'out', message: 'Rupture de stock' };
  }

  const h = hash(product.id);
  const isPromo = !!product.prix_promo || product.tags?.includes('promo');
  const isHot = product.tags?.includes('bestseller') || product.tags?.includes('nouveau');

  let min: number, max: number;
  if (isPromo) { min = 5; max = 25; }
  else if (isHot) { min = 15; max = 40; }
  else { min = 35; max = 70; }

  const pct = min + (h % (max - min + 1));
  // Estimated capacity ~ 20 units → display units
  const capacity = 20;
  const units = Math.max(1, Math.round((pct / 100) * capacity));

  let level: StockUrgency['level'];
  let message: string;
  if (pct <= 15) { level = 'critical'; message = `Plus que ${units} en stock !`; }
  else if (pct <= 35) { level = 'low'; message = `Bientôt en rupture — ${units} restants`; }
  else if (pct <= 60) { level = 'medium'; message = `Stock limité`; }
  else { level = 'high'; message = `En stock`; }

  return { inStock: true, remainingPct: pct, remainingUnits: units, level, message };
}
