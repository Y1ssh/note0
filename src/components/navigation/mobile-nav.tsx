'use client';

import React, { createContext, useContext, useState } from 'react';

interface MobileNavContextType {
  isOpen: boolean;
  toggleNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

interface MobileNavProviderProps {
  children: React.ReactNode;
}

export const MobileNavProvider: React.FC<MobileNavProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => setIsOpen(!isOpen);

  return (
    <MobileNavContext.Provider value={{ isOpen, toggleNav }}>
      {children}
    </MobileNavContext.Provider>
  );
};

export const ResponsiveNav: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(MobileNavContext);
  
  if (!context) {
    throw new Error('ResponsiveNav must be used within MobileNavProvider');
  }

  return (
    <div className={`md:hidden ${context.isOpen ? 'block' : 'hidden'}`}>
      {children}
    </div>
  );
}; 