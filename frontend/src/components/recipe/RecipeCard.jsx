// frontend/src/components/recipe/RecipeCard.jsx - MOBILE RESPONSIVE
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
      className="glass rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg md:shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Header */}
      <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
        {recipe.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
        {recipe.description}
      </p>

      {/* Recipe Info */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 md:w-4 md:h-4" />
          <span>{recipe.total_time}m</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 md:w-4 md:h-4" />
          <span>{recipe.servings}</span>
        </div>
        <span className="px-2 md:px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-[10px] md:text-xs font-medium">
          {recipe.difficulty}
        </span>
      </div>
    </div>
  );
};