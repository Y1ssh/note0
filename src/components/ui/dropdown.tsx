'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ children, trigger, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  onClick, 
  className = '' 
}) => {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const DropdownLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {children}
    </div>
  );
};

export const DropdownSeparator: React.FC = () => {
  return <div className="border-t border-gray-200 my-1" />;
}; 