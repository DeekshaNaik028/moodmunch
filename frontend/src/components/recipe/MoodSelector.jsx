// frontend/src/components/recipe/MoodSelector.jsx - MOBILE RESPONSIVE
import React from 'react';
import { MOODS } from '../../utils/constants';

export const MoodSelector = ({ selectedMood, onMoodChange }) => {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
        How are you feeling?
      </h3>
      {/* Desktop: 4 columns, Tablet: 4 columns, Mobile: 4 columns (2 rows) */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-2 md:gap-3">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onMoodChange(mood.value)}
            className={`p-3 md:p-4 rounded-xl text-center transition-all ${
              selectedMood === mood.value
                ? 'gradient-primary text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <div className="text-2xl md:text-3xl mb-1">{mood.emoji}</div>
            <div className="text-[10px] md:text-sm font-medium truncate">
              {mood.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};