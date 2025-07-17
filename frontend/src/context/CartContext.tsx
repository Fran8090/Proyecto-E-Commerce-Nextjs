'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Book {
  id: number;
  nombre: string;
  autor: string;
  precio: number;
  img?: string;
  stock?: number;
}

interface CartItem extends Book {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: number) => void;
  updateQuantity: (bookId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  canUpdateQuantity: (bookId: number, newQuantity: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedItems = JSON.parse(savedCart);
      // Verificar que cada item tenga un id
      const validItems = parsedItems.filter((item: CartItem) => {
        if (!item.id) {
          return false;
        }
        return true;
      });
      setItems(validItems);
    }
  }, []);

  
  useEffect(() => {
    // Verificar que cada item tenga un id antes de guardar
    const validItems = items.filter(item => {
      if (!item.id) {
        return false;
      }
      return true;
    });
    localStorage.setItem('cart', JSON.stringify(validItems));
    // Calculate total
    const newTotal = validItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    setTotal(newTotal);
  }, [items]);

  const addToCart = (book: Book) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === book.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentItems, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== bookId));
  };

  const updateQuantity = (bookId: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === bookId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const canUpdateQuantity = (bookId: number, newQuantity: number) => {
    const item = items.find(item => item.id === bookId);
    if (!item) return false;
    // Si no hay información de stock, permitir cualquier cantidad positiva
    if (item.stock === undefined) return newQuantity >= 1;
    return newQuantity >= 1 && newQuantity <= item.stock;
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      total,
      canUpdateQuantity
    }}>
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