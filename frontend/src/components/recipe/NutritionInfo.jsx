import React from 'react';

export const NutritionInfo = ({ nutrition }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
        Nutrition Info
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="gradient-card rounded-xl p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {nutrition.calories}
          </div>
        </div>
        <div className="gradient-card rounded-xl p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {nutrition.protein}g
          </div>
        </div>
        <div className="gradient-card rounded-xl p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {nutrition.carbs}g
          </div>
        </div>
        <div className="gradient-card rounded-xl p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {nutrition.fat}g
          </div>
        </div>
      </div>
    </div>
  );
};
