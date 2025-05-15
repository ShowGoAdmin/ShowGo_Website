import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [quantity, setQuantity] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const increment = (maxAvailable = Infinity) => {  // Default to Infinity if maxAvailable not provided
    if (!selectedTicket) {
      alert("Please select a ticket first");
      return;
    }
    setQuantity(prev => (prev < maxAvailable ? prev + 1 : prev));
  };
  
  const decrement = () => {
    setQuantity(prev => (prev > 0 ? prev - 1 : prev));
  };
  
  const updateSelectedTicket = (ticket) => {
    setSelectedTicket(ticket);
    setQuantity(1);  // Set to 1 when new ticket is selected instead of 0
  };

  return (
    <CartContext.Provider value={{
      quantity,
      selectedTicket,
      increment,
      decrement,
      updateSelectedTicket,
      setQuantity  // Expose setQuantity if needed elsewhere
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);