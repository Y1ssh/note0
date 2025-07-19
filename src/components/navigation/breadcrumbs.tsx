'use client';

import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
            {item.href ? (
              <a 
                href={item.href}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-gray-500 text-sm">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}; 