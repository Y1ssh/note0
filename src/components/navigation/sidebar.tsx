'use client';

import React from 'react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  return (
    <div className={`w-64 bg-gray-50 border-r border-gray-200 h-full ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <nav className="space-y-2">
          <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            All Notes
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Recent
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Favorites
          </a>
          <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Trash
          </a>
        </nav>
      </div>
    </div>
  );
}; 