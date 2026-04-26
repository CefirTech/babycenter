import { describe, it, expect } from 'vitest';

// Logique métier extraite : calcul du total panier
const computeTotal = (items: Array<{ prix_vente: number; prix_promo: number | null; quantite: number }>) =>
  items.reduce((sum, i) => sum + (i.prix_promo ?? i.prix_vente) * i.quantite, 0);

// Logique métier : application d'une remise (pourcentage ou montant fixe)
const applyDiscount = (sousTotal: number, type: 'pourcentage' | 'montant_fixe', valeur: number) => {
  if (type === 'pourcentage') return Math.max(0, sousTotal - sousTotal * (valeur / 100));
  return Math.max(0, sousTotal - valeur);
};

describe('computeTotal', () => {
  it('utilise prix_promo quand présent', () => {
    expect(computeTotal([{ prix_vente: 10000, prix_promo: 7500, quantite: 2 }])).toBe(15000);
  });
  it('utilise prix_vente sinon', () => {
    expect(computeTotal([{ prix_vente: 5000, prix_promo: null, quantite: 3 }])).toBe(15000);
  });
  it('panier vide = 0', () => {
    expect(computeTotal([])).toBe(0);
  });
  it('combine plusieurs lignes', () => {
    expect(
      computeTotal([
        { prix_vente: 10000, prix_promo: null, quantite: 1 },
        { prix_vente: 8000, prix_promo: 6000, quantite: 2 },
      ])
    ).toBe(22000);
  });
});

describe('applyDiscount', () => {
  it('applique un pourcentage', () => {
    expect(applyDiscount(20000, 'pourcentage', 10)).toBe(18000);
  });
  it('applique un montant fixe', () => {
    expect(applyDiscount(20000, 'montant_fixe', 5000)).toBe(15000);
  });
  it('ne descend jamais sous 0', () => {
    expect(applyDiscount(1000, 'montant_fixe', 5000)).toBe(0);
  });
  it('100% = gratuit', () => {
    expect(applyDiscount(20000, 'pourcentage', 100)).toBe(0);
  });
});
