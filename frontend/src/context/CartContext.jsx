import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Use a user-specific key, fallback to 'cart_guest'
  const getCartKey = () => (user ? `cart_${user.id || user._id}` : 'cart_guest');

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(getCartKey());
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  // Re-initialize cart when user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getCartKey());
      setCart(saved ? JSON.parse(saved) : []);
    } catch (error) {
      setCart([]);
    }
  }, [user]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
  }, [cart, user]);

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
