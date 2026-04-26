import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { SFProduct as Product, SFVariant as ProductVariant } from '@/hooks/useStorefrontData';

const STORAGE_KEY = 'babycenter_cart_v1';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantite: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, qty?: number) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);


  const addItem = useCallback((product: Product, variant: ProductVariant, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.variant.id === variant.id);
      if (existing) {
        return prev.map(i => i.variant.id === variant.id ? { ...i, quantite: i.quantite + qty } : i);
      }
      return [...prev, { product, variant, quantite: qty }];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(i => i.variant.id !== variantId));
  }, []);

  const updateQty = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.variant.id !== variantId));
    } else {
      setItems(prev => prev.map(i => i.variant.id === variantId ? { ...i, quantite: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => {
    const prix = i.product.prix_promo ?? i.product.prix_vente;
    return sum + prix * i.quantite;
  }, 0);

  const itemCount = items.reduce((sum, i) => sum + i.quantite, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
