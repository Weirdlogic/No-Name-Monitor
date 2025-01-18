// src/components/ui/Card.tsx
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {children}
    </div>
  );
};