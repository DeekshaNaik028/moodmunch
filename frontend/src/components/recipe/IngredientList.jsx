import React from 'react';
import { X } from 'lucide-react';

export const IngredientList = ({ ingredients, onRemove }) => {
  if (ingredients.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
        Your Ingredients
      </h3>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing, idx) => (
          <span
            key={idx}
            className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
          >
            {ing}
            <button
              onClick={() => onRemove(idx)}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};