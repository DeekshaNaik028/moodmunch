import React from 'react';

export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div 
      className={`glass rounded-3xl p-6 shadow-xl ${
        hover ? 'hover:shadow-2xl transition-shadow cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};