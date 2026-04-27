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

  const addToCart = (event, quantity, selectedTicketName = '') => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.eventId === event._id && item.selectedTicketName === selectedTicketName
      );
      if (existingItemIndex >= 0) {
        return prev.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { eventId: event._id, event, quantity, selectedTicketName }];
    });
  };

  const removeFromCart = (eventId, selectedTicketName = '') => {
    setCart((prev) => prev.filter((item) => !(item.eventId === eventId && item.selectedTicketName === selectedTicketName)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      let price = item.event.ticketPrice || 0;
      if (item.selectedTicketName && Array.isArray(item.event.tickets)) {
        const t = item.event.tickets.find(tick => tick.name === item.selectedTicketName);
        if (t) price = t.price;
      }
      return total + (price * item.quantity);
    }, 0);
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
