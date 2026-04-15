export interface Category {
  id: string;
  nom: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
}

export interface Product {
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
  statut: 'actif' | 'brouillon' | 'rupture' | 'archive';
  featured: boolean;
  images: string[];
  variants: ProductVariant[];
  created_at: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  taille: string;
  couleur: string;
  stock: number;
  seuil_alerte: number;
  statut: 'actif' | 'rupture';
}

export interface Customer {
  id: string;
  nom: string;
  telephone: string;
  whatsapp: string;
  email: string;
  ville: string;
  total_depense: number;
  commandes: number;
}

export interface Order {
  id: string;
  numero_commande: string;
  customer_id: string;
  customer_nom: string;
  canal: string;
  statut: string;
  total: number;
  created_at: string;
}

export const categories: Category[] = [
  { id: '1', nom: 'Robes', slug: 'robes', description: 'Robes élégantes pour petites princesses', image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400', parent_id: null },
  { id: '2', nom: 'Ensembles', slug: 'ensembles', description: 'Ensembles coordonnés pour un look parfait', image_url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400', parent_id: null },
  { id: '3', nom: 'T-shirts', slug: 't-shirts', description: 'T-shirts confortables et stylés', image_url: 'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=400', parent_id: null },
  { id: '4', nom: 'Pantalons', slug: 'pantalons', description: 'Pantalons pour toutes les occasions', image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', parent_id: null },
  { id: '5', nom: 'Chaussures', slug: 'chaussures', description: 'Chaussures confortables et tendance', image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400', parent_id: null },
  { id: '6', nom: 'Accessoires', slug: 'accessoires', description: 'Accessoires pour compléter le look', image_url: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=400', parent_id: null },
  { id: '7', nom: 'Nouveau-né', slug: 'nouveau-ne', description: 'Vêtements doux pour les tout-petits', image_url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400', parent_id: null },
  { id: '8', nom: 'Fêtes', slug: 'fetes', description: 'Tenues de cérémonie et occasions spéciales', image_url: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400', parent_id: null },
];

const productImages = [
  'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600',
  'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600',
  'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600',
  'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600',
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600',
];

function generateProducts(): Product[] {
  const names = [
    'Robe Florale Printemps', 'Ensemble Sport Chic', 'T-shirt Étoiles Dorées', 'Pantalon Coton Bio',
    'Robe Cérémonie Rose', 'Ensemble Marinière', 'T-shirt Tropical', 'Jean Slim Stretch',
    'Robe Tutu Princesse', 'Ensemble Jogging Doux', 'Polo Classic', 'Bermuda Plage',
    'Robe Dentelle Ivoire', 'Ensemble Pyjama Nuages', 'Chemise Lin Naturel', 'Short Cargo Adventure',
    'Robe Bohème Été', 'Ensemble Hiver Cocooning', 'Sweat Capuche Rainbow', 'Legging Yoga Kids',
    'Robe Patineuse Velours', 'Ensemble Baptême Blanc', 'T-shirt Dinosaure', 'Pantalon Toile Camel',
    'Robe Garden Party', 'Ensemble Marin Rayé', 'Blouse Vichy Rose', 'Salopette Jean',
    'Robe Midi Fleurie', 'Ensemble Sport Track', 'Gilet Maille Torsadée', 'Jupe Plissée Satin',
    'Combi-short Vacances', 'Body Coton Étoilé', 'Cardigan Laine Douce', 'Bloomer Liberty',
    'Robe Smockée Cerise', 'Barboteuse Rayée', 'Veste Teddy Sherpa', 'Legging Imprimé Floral',
    'Robe Brodée Anglaise', 'Combinaison Polaire', 'Chemisier Peter Pan', 'Pantalon Palazzo Mini',
    'Robe Volantée Corail', 'Ensemble Cérémonie Or', 'T-shirt Bio Animaux', 'Jogging Velours',
    'Tunique Bohème', 'Ensemble Plage Tropical', 'Body Naissance Pack', 'Cape Pluie Étoiles',
    'Robe Tartan Noël', 'Costume Petit Prince', 'Jupe Tulle Arc-en-ciel', 'Blouse Brodée Été',
    'Robe Patineuse Marine', 'Ensemble Rentrée Chic', 'Pull Marin Rayé', 'Pantalon Chino Smart',
  ];

  const catIds = ['1','2','3','4','1','2','3','4','1','2','3','4','1','2','3','4','1','2','3','4','1','2','3','4','1','2','3','4','1','2','3','4','1','7','6','7','1','7','6','4','1','2','3','4','1','8','3','4','3','2','7','6','8','8','1','3','1','2','3','4'];
  const ages = ['0-1 an','1-3 ans','4-6 ans','7-10 ans','11-13 ans','14-16 ans'];
  const sexes: ('fille'|'garcon'|'unisexe')[] = ['fille','garcon','unisexe'];
  const tailles = ['3M','6M','12M','18M','2A','3A','4A','5A','6A','8A','10A','12A','14A','16A'];
  const couleurs = ['Rose','Blanc','Bleu Marine','Rouge','Beige','Vert Sauge','Jaune','Corail'];

  return names.map((nom, i) => {
    const prixVente = Math.round((15 + Math.random() * 85) * 100) / 100;
    const hasPromo = Math.random() > 0.7;
    return {
      id: `prod-${i + 1}`,
      code_produit: `KID-${String(i + 1).padStart(4, '0')}`,
      nom,
      slug: nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description_courte: `${nom} - Qualité premium pour enfants`,
      description_longue: `Découvrez notre ${nom.toLowerCase()}, confectionné(e) avec des matériaux de haute qualité, doux pour la peau sensible des enfants. Design élégant et confortable, parfait pour toutes les occasions. Lavable en machine à 30°C.`,
      categorie_id: catIds[i],
      tranche_age: ages[i % ages.length],
      sexe: sexes[i % sexes.length],
      saison: ['Printemps-Été', 'Automne-Hiver', 'Toutes saisons'][i % 3],
      marque: ['Petit Bateau', 'Jacadi', 'Bonpoint', 'Tartine et Chocolat', ''][i % 5],
      tags: ['nouveau', 'bestseller', 'bio', 'promo', 'exclusif'].slice(0, 1 + (i % 3)),
      prix_achat: Math.round(prixVente * 0.4 * 100) / 100,
      prix_vente: prixVente,
      prix_promo: hasPromo ? Math.round(prixVente * 0.75 * 100) / 100 : null,
      statut: 'actif' as const,
      featured: i < 8,
      images: [productImages[i % productImages.length], productImages[(i + 1) % productImages.length]],
      variants: [
        { id: `var-${i}-1`, sku: `KID-${String(i+1).padStart(4,'0')}-${tailles[i%tailles.length]}-R`, taille: tailles[i % tailles.length], couleur: couleurs[i % couleurs.length], stock: Math.floor(Math.random() * 20) + 1, seuil_alerte: 3, statut: 'actif' as const },
        { id: `var-${i}-2`, sku: `KID-${String(i+1).padStart(4,'0')}-${tailles[(i+1)%tailles.length]}-B`, taille: tailles[(i+1) % tailles.length], couleur: couleurs[(i+1) % couleurs.length], stock: Math.floor(Math.random() * 15), seuil_alerte: 3, statut: 'actif' as const },
      ],
      created_at: new Date(2025, i % 12, (i % 28) + 1).toISOString(),
    };
  });
}

export const products = generateProducts();

export const customers: Customer[] = [
  { id: 'c1', nom: 'Aminata Koné', telephone: '+225 07 08 09 10', whatsapp: '+225 07 08 09 10', email: 'aminata@email.com', ville: 'Abidjan', total_depense: 245000, commandes: 8 },
  { id: 'c2', nom: 'Fatou Diallo', telephone: '+225 05 12 34 56', whatsapp: '+225 05 12 34 56', email: 'fatou@email.com', ville: 'Bouaké', total_depense: 180000, commandes: 5 },
  { id: 'c3', nom: 'Marie Bamba', telephone: '+225 01 23 45 67', whatsapp: '+225 01 23 45 67', email: 'marie@email.com', ville: 'Abidjan', total_depense: 320000, commandes: 12 },
  { id: 'c4', nom: 'Awa Touré', telephone: '+225 07 65 43 21', whatsapp: '+225 07 65 43 21', email: 'awa@email.com', ville: 'Yamoussoukro', total_depense: 95000, commandes: 3 },
  { id: 'c5', nom: 'Clémentine Yao', telephone: '+225 05 98 76 54', whatsapp: '+225 05 98 76 54', email: 'clementine@email.com', ville: 'Abidjan', total_depense: 450000, commandes: 15 },
];

export const recentOrders: Order[] = [
  { id: 'o1', numero_commande: 'CMD-2025-001', customer_id: 'c1', customer_nom: 'Aminata Koné', canal: 'Site web', statut: 'livrée', total: 45000, created_at: '2025-04-10' },
  { id: 'o2', numero_commande: 'CMD-2025-002', customer_id: 'c3', customer_nom: 'Marie Bamba', canal: 'WhatsApp', statut: 'en préparation', total: 32000, created_at: '2025-04-12' },
  { id: 'o3', numero_commande: 'CMD-2025-003', customer_id: 'c5', customer_nom: 'Clémentine Yao', canal: 'Site web', statut: 'payée', total: 78000, created_at: '2025-04-13' },
  { id: 'o4', numero_commande: 'CMD-2025-004', customer_id: 'c2', customer_nom: 'Fatou Diallo', canal: 'Instagram', statut: 'en attente de paiement', total: 25000, created_at: '2025-04-14' },
  { id: 'o5', numero_commande: 'CMD-2025-005', customer_id: 'c4', customer_nom: 'Awa Touré', canal: 'Boutique', statut: 'livrée', total: 55000, created_at: '2025-04-14' },
];

export const dashboardStats = {
  chiffre_affaires_mois: 1_850_000,
  commandes_mois: 47,
  panier_moyen: 39_362,
  nouvelles_clientes: 12,
  ventes_par_canal: [
    { canal: 'Site web', montant: 750000, pourcentage: 40 },
    { canal: 'WhatsApp', montant: 555000, pourcentage: 30 },
    { canal: 'Boutique', montant: 370000, pourcentage: 20 },
    { canal: 'Instagram', montant: 175000, pourcentage: 10 },
  ],
  top_produits: [
    { nom: 'Robe Florale Printemps', ventes: 23, montant: 690000 },
    { nom: 'Ensemble Sport Chic', ventes: 18, montant: 540000 },
    { nom: 'Robe Cérémonie Rose', ventes: 15, montant: 675000 },
    { nom: 'T-shirt Étoiles Dorées', ventes: 14, montant: 210000 },
    { nom: 'Jean Slim Stretch', ventes: 12, montant: 360000 },
  ],
  alertes_stock: 8,
  commandes_en_attente: 5,
};
