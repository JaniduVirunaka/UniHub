import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (event, quantity) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.eventId === event._id);
      if (existingItem) {
        return prev.map((item) =>
          item.eventId === event._id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { eventId: event._id, event, quantity }];
    });
  };

  const removeFromCart = (eventId) => {
    setCart((prev) => prev.filter((item) => item.eventId !== eventId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.event.ticketPrice * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, clearCart, getTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
