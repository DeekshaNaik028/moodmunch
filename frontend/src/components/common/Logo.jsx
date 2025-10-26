import React from 'react';

export const Logo = ({ size = 'default', className = '' }) => {
  const sizes = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-20 h-20',
  };

  return (
    <div className={`${sizes[size]} relative ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Plate base */}
        <circle cx="50" cy="50" r="45" fill="url(#gradient1)" />
        <circle cx="50" cy="50" r="42" fill="white" fillOpacity="0.2" />
        
        {/* Fork */}
        <path
          d="M30 35 L30 55 M28 35 L28 50 M32 35 L32 50 M30 50 L30 65"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Spoon */}
        <ellipse cx="50" cy="40" rx="6" ry="8" fill="white" />
        <path
          d="M50 48 L50 65"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Knife */}
        <path
          d="M70 35 L70 65 M68 35 L72 35"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Heart accent (for mood) */}
        <path
          d="M50 72 C48 70, 42 70, 42 75 C42 78, 45 81, 50 84 C55 81, 58 78, 58 75 C58 70, 52 70, 50 72 Z"
          fill="#FF69B4"
          opacity="0.8"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#861657" />
            <stop offset="100%" stopColor="#D56AA0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
