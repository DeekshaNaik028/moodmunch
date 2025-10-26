import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-pink-600 dark:text-pink-400 ${className}`} 
      />
    </div>
  );
};