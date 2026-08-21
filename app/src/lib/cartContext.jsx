import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('farmtrust_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('farmtrust_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        farmer_id: product.farmer_id,
        farmer_name: product.farmer_name,
        farm_id: product.farm_id,
        farm_name: product.farm_name,
        price_per_unit: product.price_per_unit,
        unit: product.unit,
        quantity,
        photo_url: product.photo_url,
        minimum_order: product.minimum_order || 1
      }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product_id !== productId));
      return;
    }
    setItems(prev => prev.map(i =>
      i.product_id === productId ? { ...i, quantity } : i
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price_per_unit * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  // Group items by farmer for order splitting
  const groupedByFarmer = items.reduce((acc, item) => {
    if (!acc[item.farmer_id]) {
      acc[item.farmer_id] = { farmer_id: item.farmer_id, farmer_name: item.farmer_name, items: [] };
    }
    acc[item.farmer_id].items.push(item);
    return acc;
  }, {});

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    count,
    groupedByFarmer: Object.values(groupedByFarmer)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
