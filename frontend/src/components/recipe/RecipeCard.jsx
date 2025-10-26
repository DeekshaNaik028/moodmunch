import React from 'react';
import { Clock, Users } from 'lucide-react';

export const RecipeCard = ({ recipe, onClick }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="glass rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Header */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        {recipe.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
        {recipe.description}
      </p>

      {/* Recipe Info */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{recipe.total_time}m</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{recipe.servings}</span>
        </div>
        <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium">
          {recipe.difficulty}
        </span>
      </div>
    </div>
  );
};
