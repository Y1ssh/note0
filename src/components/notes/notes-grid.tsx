'use client';

import React from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface NotesGridProps {
  notes?: Note[];
  onNoteClick?: (note: Note) => void;
  className?: string;
}

export const NotesGrid: React.FC<NotesGridProps> = ({ 
  notes = [], 
  onNoteClick, 
  className = '' 
}) => {
  const defaultNotes: Note[] = [
    {
      id: '1',
      title: 'Welcome to Note0',
      content: 'This is your first note! You can create, edit, and organize your notes here.',
      date: '2024-01-01'
    },
    {
      id: '2',
      title: 'Getting Started',
      content: 'Here are some tips to get you started with Note0...',
      date: '2024-01-02'
    }
  ];

  const displayNotes = notes.length > 0 ? notes : defaultNotes;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {displayNotes.map((note) => (
        <div
          key={note.id}
          onClick={() => onNoteClick?.(note)}
          className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-3 mb-3">{note.content}</p>
            <p className="text-xs text-gray-500">{note.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}; 