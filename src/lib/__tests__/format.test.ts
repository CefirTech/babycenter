import { describe, it, expect } from 'vitest';
import { fcfa, slugify, shortDate } from '@/lib/format';

describe('fcfa', () => {
  it('formate un nombre entier en FCFA avec espaces', () => {
    expect(fcfa(15000)).toBe('15\u202f000 FCFA');
  });
  it('gère null et undefined comme 0', () => {
    expect(fcfa(null)).toBe('0 FCFA');
    expect(fcfa(undefined)).toBe('0 FCFA');
  });
  it('gère les grands montants', () => {
    expect(fcfa(1234567)).toBe('1\u202f234\u202f567 FCFA');
  });
});

describe('slugify', () => {
  it('normalise les accents et la casse', () => {
    expect(slugify('Robe Élégante Été')).toBe('robe-elegante-ete');
  });
  it('remplace les caractères spéciaux par tirets', () => {
    expect(slugify('T-shirt 100% coton !')).toBe('t-shirt-100-coton');
  });
  it('supprime tirets en début et fin', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });
});

describe('shortDate', () => {
  it('formate une date ISO en jj/mm/aaaa', () => {
    expect(shortDate('2025-03-15T10:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});
