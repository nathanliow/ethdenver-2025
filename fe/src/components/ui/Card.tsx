import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
} 