'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('mira_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Guardar carrito
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mira_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product) => {
    setCart((prev) => {
      // Evitar duplicados por nombre
      if (prev.find(p => p.name === product.name)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCart = (productName) => {
    setCart((prev) => prev.filter(p => p.name !== productName));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
