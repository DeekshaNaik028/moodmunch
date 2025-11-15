// frontend/src/components/mood/InteractiveMoodFlow.jsx - UPDATED (NO SKIP)
import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Activity } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export const InteractiveMoodFlow = ({ onMoodCalculated }) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    energyLevel: 5,
    mealType: '',
    emotionalState: '',
  });

  // Question 1: Energy Level (1-10)
  const renderEnergyQuestion = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          How's your energy level right now?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us recommend the right meal for you
        </p>
      </div>

      {/* Energy Level Slider */}
      <div className="px-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>😴 Low</span>
          <span className="font-semibold text-lg text-gray-800 dark:text-white">
            {answers.energyLevel}/10
          </span>
          <span>⚡ High</span>
        </div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={answers.energyLevel}
          onChange={(e) => setAnswers({ ...answers, energyLevel: parseInt(e.target.value) })}
          className="w-full h-3 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, 
              #3B82F6 0%, 
              #8B5CF6 ${answers.energyLevel * 10}%, 
              #E5E7EB ${answers.energyLevel * 10}%, 
              #E5E7EB 100%)`
          }}
        />

        {/* Energy Level Indicators */}
        <div className="flex justify-between mt-4 px-2">
          <div className="text-center">
            <div className="text-2xl mb-1">😴</div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Tired</span>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">😐</div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Okay</span>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🙂</div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Good</span>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Energized</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setStep(2)}
        icon={ArrowRight}
        className="w-full mt-6"
      >
        Continue
      </Button>
    </div>
  );

  // Question 2: Meal Type Preference
  const renderMealTypeQuestion = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-3xl">
          🍽️
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          What type of meal appeals to you?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Choose what sounds best right now
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { 
            value: 'comfort', 
            emoji: '🤗', 
            label: 'Comfort Food',
            desc: 'Warm, cozy, and soul-satisfying'
          },
          { 
            value: 'light', 
            emoji: '🥗', 
            label: 'Light & Fresh',
            desc: 'Crisp, refreshing, and energizing'
          },
          { 
            value: 'hearty', 
            emoji: '🍖', 
            label: 'Hearty & Filling',
            desc: 'Substantial, protein-rich meals'
          },
          { 
            value: 'quick', 
            emoji: '⚡', 
            label: 'Quick & Simple',
            desc: 'Easy to make, minimal effort'
          },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setAnswers({ ...answers, mealType: option.value })}
            className={`p-4 rounded-2xl text-left transition-all transform hover:scale-102 ${
              answers.mealType === option.value
                ? 'gradient-primary text-white shadow-xl scale-102'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{option.emoji}</div>
              <div className="flex-1">
                <div className={`font-bold text-lg mb-1 ${
                  answers.mealType === option.value 
                    ? 'text-white' 
                    : 'text-gray-800 dark:text-white'
                }`}>
                  {option.label}
                </div>
                <div className={`text-sm ${
                  answers.mealType === option.value 
                    ? 'text-pink-100' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {option.desc}
                </div>
              </div>
              {answers.mealType === option.value && (
                <div className="text-white text-2xl">✓</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={() => setStep(1)}
          variant="secondary"
          icon={ArrowLeft}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={!answers.mealType}
          icon={ArrowRight}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // Question 3: Emotional State
  const renderEmotionalStateQuestion = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl">
          💭
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          How are you feeling emotionally?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We'll match the perfect recipe to your mood
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { value: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-500' },
          { value: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-red-400 to-pink-500' },
          { value: 'calm', emoji: '😌', label: 'Calm', color: 'from-blue-400 to-cyan-500' },
          { value: 'excited', emoji: '🤩', label: 'Excited', color: 'from-purple-400 to-pink-500' },
          { value: 'sad', emoji: '😢', label: 'Down', color: 'from-gray-400 to-blue-500' },
          { value: 'bored', emoji: '😑', label: 'Bored', color: 'from-gray-400 to-purple-500' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setAnswers({ ...answers, emotionalState: option.value })}
            className={`p-6 rounded-2xl text-center transition-all transform hover:scale-105 ${
              answers.emotionalState === option.value
                ? `bg-gradient-to-br ${option.color} text-white shadow-xl scale-105`
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-4xl mb-2">{option.emoji}</div>
            <div className={`font-bold ${
              answers.emotionalState === option.value 
                ? 'text-white' 
                : 'text-gray-800 dark:text-white'
            }`}>
              {option.label}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={() => setStep(2)}
          variant="secondary"
          icon={ArrowLeft}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!answers.emotionalState}
          icon={Sparkles}
          className="flex-1"
        >
          Complete
        </Button>
      </div>
    </div>
  );

  const handleSubmit = () => {
    // Calculate final mood based on all answers
    const calculatedMood = calculateMood(answers);
    onMoodCalculated(calculatedMood, answers);
  };

  const calculateMood = (answers) => {
    const { energyLevel, mealType, emotionalState } = answers;

    // If emotional state is directly provided, prioritize it
    if (emotionalState) {
      // Fine-tune based on energy level and meal preference
      if (energyLevel <= 3 && mealType === 'quick') {
        return 'tired';
      }
      if (energyLevel >= 8 && emotionalState === 'happy') {
        return 'energetic';
      }
      return emotionalState;
    }

    // Fallback calculation
    if (energyLevel <= 3) return 'tired';
    if (energyLevel >= 8) return 'energetic';
    if (mealType === 'comfort') return 'calm';
    return 'happy';
  };

  return (
    <Card className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {step} of 3
          </span>
          <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
            {Math.round((step / 3) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {step === 1 && renderEnergyQuestion()}
      {step === 2 && renderMealTypeQuestion()}
      {step === 3 && renderEmotionalStateQuestion()}
    </Card>
  );
};