import { supabase } from '@/integrations/supabase/client';

const FALLBACK_IMG = '/placeholder.svg';

export interface SFVariant {
  id: string;
  sku: string;
  taille: string;
  couleur: string;
  stock: number;
  seuil_alerte: number;
  statut: 'actif' | 'rupture';
}

export interface SFProduct {
  id: string;
  code_produit: string;
  nom: string;
  slug: string;
  description_courte: string;
  description_longue: string;
  categorie_id: string;
  tranche_age: string;
  sexe: 'fille' | 'garcon' | 'unisexe';
  saison: string;
  marque: string;
  tags: string[];
  prix_achat: number;
  prix_vente: number;
  prix_promo: number | null;
  statut: 'actif' | 'inactif' | 'rupture';
  featured: boolean;
  images: string[];
  variants: SFVariant[];
  created_at: string;
}

export interface SFCategory {
  id: string;
  nom: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
}

function mapProduct(p: Record<string, unknown>, variants: Record<string, unknown>[]): SFProduct {
  return {
    id: p.id as string,
    code_produit: p.code_produit as string,
    nom: p.nom as string,
    slug: p.slug as string,
    description_courte: p.description ? String(p.description).slice(0, 140) : '',
    description_longue: (p.description as string) || '',
    categorie_id: (p.categorie_id as string) || '',
    tranche_age: (p.tranche_age as string) || '',
    sexe: ((p.genre as string) ?? 'unisexe') as SFProduct['sexe'],
    saison: '',
    marque: (p.marque as string) || '',
    tags: [
      ...(p.est_nouveaute ? ['nouveau'] : []),
      ...(p.est_meilleure_vente ? ['bestseller'] : []),
      ...(p.prix_promo ? ['promo'] : []),
    ],
    prix_achat: 0,
    prix_vente: Number(p.prix_vente) || 0,
    prix_promo: p.prix_promo != null ? Number(p.prix_promo) : null,
    statut: p.statut as SFProduct['statut'],
    featured: !!(p.est_nouveaute || p.est_meilleure_vente),
    images: (p.images as string[])?.length > 0 ? (p.images as string[]) : [FALLBACK_IMG],
    variants: variants.map((v) => ({
      id: v.id as string,
      sku: (v.sku as string) || '',
      taille: (v.taille as string) || '',
      couleur: (v.couleur as string) || '',
      stock: v.en_stock ? 999 : 0,
      seuil_alerte: 0,
      statut: v.en_stock ? 'actif' : 'rupture',
    })),
    created_at: p.created_at as string,
  };
}

export async function fetchStorefrontData(): Promise<{ products: SFProduct[]; categories: SFCategory[] }> {
  const [{ data: p, error: pe }, { data: c, error: ce }, { data: v, error: ve }] = await Promise.all([
    supabase.from('products_public').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('statut', 'publie').order('ordre'),
    supabase.from('product_variants_public').select('*'),
  ]);

  if (pe) console.error('[storefront] products error', pe);
  if (ce) console.error('[storefront] categories error', ce);
  if (ve) console.error('[storefront] variants error', ve);

  const variantsByProd = ((v ?? []) as Record<string, unknown>[]).reduce<Record<string, Record<string, unknown>[]>>(
    (acc, x) => {
      const pid = x.product_id as string;
      (acc[pid] ||= []).push(x);
      return acc;
    },
    {},
  );

  const products = ((p ?? []) as Record<string, unknown>[]).map((prod) =>
    mapProduct(prod, variantsByProd[prod.id as string] ?? []),
  );

  const categories: SFCategory[] = ((c ?? []) as Record<string, unknown>[]).map((cat) => ({
    id: cat.id as string,
    nom: cat.nom as string,
    slug: cat.slug as string,
    description: (cat.description as string) || '',
    image_url: (cat.image_url as string) || FALLBACK_IMG,
    parent_id: (cat.parent_id as string | null) ?? null,
  }));

  return { products, categories };
}
