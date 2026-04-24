import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const FALLBACK_IMG = '/placeholder.svg';

function mapProduct(p: any, variants: any[]): SFProduct {
  return {
    id: p.id,
    code_produit: p.code_produit,
    nom: p.nom,
    slug: p.slug,
    description_courte: p.description ? String(p.description).slice(0, 140) : '',
    description_longue: p.description || '',
    categorie_id: p.categorie_id || '',
    tranche_age: p.tranche_age || '',
    sexe: (p.genre as any) || 'unisexe',
    saison: '',
    marque: p.marque || '',
    tags: [
      ...(p.est_nouveaute ? ['nouveau'] : []),
      ...(p.est_meilleure_vente ? ['bestseller'] : []),
      ...(p.prix_promo ? ['promo'] : []),
    ],
    prix_achat: 0,
    prix_vente: Number(p.prix_vente) || 0,
    prix_promo: p.prix_promo != null ? Number(p.prix_promo) : null,
    statut: p.statut,
    featured: !!p.est_nouveaute || !!p.est_meilleure_vente,
    images: (p.images && p.images.length > 0) ? p.images : [FALLBACK_IMG],
    variants: variants.map(v => ({
      id: v.id,
      sku: v.sku || '',
      taille: v.taille || '',
      couleur: v.couleur || '',
      stock: v.en_stock ? 999 : 0,
      seuil_alerte: 0,
      statut: v.en_stock ? 'actif' : 'rupture',
    })),
    created_at: p.created_at,
  };
}

export function useStorefrontData() {
  const [products, setProducts] = useState<SFProduct[]>([]);
  const [categories, setCategories] = useState<SFCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: p, error: ep }, { data: c, error: ec }, { data: v, error: ev }] = await Promise.all([
      (supabase as any).from('products_public').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('statut', 'publie').order('ordre'),
      (supabase as any).from('product_variants_public').select('*'),
    ]);
    if (ep || ec || ev) console.error('storefront load error', ep || ec || ev);
    const variantsByProd: Record<string, any[]> = (v ?? []).reduce((acc: Record<string, any[]>, x: any) => {
      (acc[x.product_id] ||= []).push(x);
      return acc;
    }, {} as Record<string, any[]>);
    setProducts((p ?? []).map(prod => mapProduct(prod, variantsByProd[prod.id] ?? [])));
    setCategories(
      (c ?? []).map((cat: any) => ({
        id: cat.id,
        nom: cat.nom,
        slug: cat.slug,
        description: cat.description || '',
        image_url: cat.image_url || FALLBACK_IMG,
        parent_id: cat.parent_id,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`storefront-products-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products, categories, loading, reload: load };
}
