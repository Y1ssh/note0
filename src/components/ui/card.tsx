'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface NoteCardProps {
  title: string;
  content: string;
  date: string;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const NoteCard: React.FC<NoteCardProps> = ({ 
  title, 
  content, 
  date, 
  onClick,
  className = '' 
}) => {
  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={onClick}>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm line-clamp-3">{content}</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-gray-500">{date}</p>
      </CardFooter>
    </Card>
  );
}; 