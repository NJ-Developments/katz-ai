import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  location: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(newItem: CartItem) {
    setItems((current) => {
      const existing = current.find((item) => item.sku === newItem.sku);
      if (existing) {
        return current.map((item) =>
          item.sku === newItem.sku
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...current, newItem];
    });
  }

  function removeItem(sku: string) {
    setItems((current) => current.filter((item) => item.sku !== sku));
  }

  function updateQuantity(sku: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(sku);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.sku === sku ? { ...item, quantity } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
