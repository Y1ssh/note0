'use client';

import React from 'react';

interface NewNoteButtonProps {
  onClick?: () => void;
  className?: string;
}

interface TemplateGalleryProps {
  className?: string;
}

interface QuickNoteInputProps {
  onSubmit?: (content: string) => void;
  className?: string;
}

export const NewNoteButton: React.FC<NewNoteButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      ➕ New Note
    </button>
  );
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ className = '' }) => {
  const templates = [
    { name: 'Blank Note', icon: '📄' },
    { name: 'Meeting Notes', icon: '🤝' },
    { name: 'Daily Journal', icon: '📔' },
    { name: 'Task List', icon: '✅' }
  ];

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {templates.map((template, index) => (
        <button
          key={index}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="text-2xl mb-2">{template.icon}</div>
          <div className="text-sm font-medium">{template.name}</div>
        </button>
      ))}
    </div>
  );
};

export const QuickNoteInput: React.FC<QuickNoteInputProps> = ({ onSubmit, className = '' }) => {
  const [content, setContent] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit?.(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Quick note..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        rows={3}
      />
      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Save Note
      </button>
    </form>
  );
}; 