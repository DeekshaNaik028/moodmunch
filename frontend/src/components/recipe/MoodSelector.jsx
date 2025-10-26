import React from 'react';
import { MOODS } from '../../utils/constants';

export const MoodSelector = ({ selectedMood, onMoodChange }) => {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
        How are you feeling?
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onMoodChange(mood.value)}
            className={`p-4 rounded-xl text-center transition-all ${
              selectedMood === mood.value
                ? 'gradient-primary text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <div className="text-3xl mb-1">{mood.emoji}</div>
            <div className="text-sm font-medium">{mood.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
