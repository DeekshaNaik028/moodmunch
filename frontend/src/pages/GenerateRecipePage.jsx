// frontend/src/pages/GenerateRecipePage.jsx - SIMPLIFIED VERSION
import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { CUISINES } from '../utils/constants';
import { capitalizeFirst } from '../utils/helpers';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { VoiceInput } from '../components/input/VoiceInput';
import { TextInput } from '../components/input/TextInput';
import { IngredientList } from '../components/recipe/IngredientList';
import { InteractiveMoodFlow } from '../components/mood/InteractiveMoodFlow';
import { RecipeDetail } from '../components/recipe/RecipeDetail';

const GenerateRecipePage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [mood, setMood] = useState('happy');
  const [moodData, setMoodData] = useState(null);
  const [cuisine, setCuisine] = useState('any');
  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInteractiveMood, setShowInteractiveMood] = useState(false);
  const [moodCollected, setMoodCollected] = useState(false);
  const [checkingMood, setCheckingMood] = useState(true);

  // Check if mood is logged today on component mount
  useEffect(() => {
    checkTodaysMood();
  }, []);

  const checkTodaysMood = async () => {
    try {
      const result = await api.mood.getTodaysMood();
      if (result.logged_today) {
        // Mood already logged today
        setMood(result.mood);
        setMoodData({
          energyLevel: result.energy_level,
          mealType: result.meal_preference,
          emotionalState: result.emotional_state,
        });
        setMoodCollected(true);
        setShowInteractiveMood(false);
      } else {
        // No mood logged today - show interactive flow
        setShowInteractiveMood(true);
      }
    } catch (err) {
      console.error('Failed to check today\'s mood:', err);
      // If error, show interactive mood flow
      setShowInteractiveMood(true);
    } finally {
      setCheckingMood(false);
    }
  };

  const handleIngredientsExtracted = (newIngredients) => {
    setIngredients([...new Set([...ingredients, ...newIngredients])]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleMoodCalculated = async (calculatedMood, detailedAnswers) => {
    setMood(calculatedMood);
    setMoodData(detailedAnswers);
    setMoodCollected(true);
    setShowInteractiveMood(false);

    // Save mood log to backend
    try {
      await api.mood.logDailyMood({
        mood: calculatedMood,
        energy_level: detailedAnswers.energyLevel,
        meal_preference: detailedAnswers.mealType,
        emotional_state: detailedAnswers.emotionalState,
      });
    } catch (err) {
      console.error('Failed to log mood:', err);
    }
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    try {
      const result = await api.recipes.generate({
        ingredients,
        mood,
        cuisine_preference: cuisine,
        servings: 2,
      });
      setRecipe(result);
      
      // Get the recipe ID from history after generation
      const history = await api.recipes.getHistory(1);
      if (history.recipes && history.recipes.length > 0) {
        setRecipeId(history.recipes[0]._id);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking mood
  if (checkingMood) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show recipe detail if recipe is generated
  if (recipe) {
    return (
      <RecipeDetail
        recipe={recipe}
        recipeId={recipeId}
        onClose={() => {
          setRecipe(null);
          setRecipeId(null);
        }}
      />
    );
  }

  // Show Interactive Mood Flow if mood not collected
  if (showInteractiveMood) {
    return (
      <InteractiveMoodFlow
        onMoodCalculated={handleMoodCalculated}
        onSkip={null} // Remove skip option
      />
    );
  }

  // Main recipe generation interface (shown after mood is collected)
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mood Summary Card */}
      {moodCollected && moodData && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                Today's Mood Profile ✨
              </h4>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
                  ⚡ Energy: {moodData.energyLevel}/10
                </span>
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 capitalize">
                  🍽️ {moodData.mealType}
                </span>
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 capitalize">
                  💭 {moodData.emotionalState}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowInteractiveMood(true)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl font-medium"
            >
              Update
            </button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
          Add Your Ingredients
        </h2>

        {/* Voice & Text Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <VoiceInput onIngredientsExtracted={handleIngredientsExtracted} />
          <TextInput onIngredientsExtracted={handleIngredientsExtracted} />
        </div>

        <IngredientList ingredients={ingredients} onRemove={removeIngredient} />

        <div className="mb-4 sm:mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 text-sm sm:text-base">
            Cuisine Preference
          </h3>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 outline-none text-sm sm:text-base"
          >
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {capitalizeFirst(c)}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={generateRecipe}
          loading={loading}
          disabled={ingredients.length === 0}
          icon={Sparkles}
          className="w-full"
        >
          Generate Recipe
        </Button>
      </Card>
    </div>
  );
};

export default GenerateRecipePage;