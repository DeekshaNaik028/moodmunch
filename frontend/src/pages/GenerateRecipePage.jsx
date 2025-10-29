import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { CUISINES } from '../utils/constants';
import { capitalizeFirst } from '../utils/helpers';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { VoiceInput } from '../components/input/VoiceInput';
import { TextInput } from '../components/input/TextInput';
import { IngredientList } from '../components/recipe/IngredientList';
import { MoodSelector } from '../components/recipe/MoodSelector';
import { RecipeDetail } from '../components/recipe/RecipeDetail';

const GenerateRecipePage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [mood, setMood] = useState('happy');
  const [cuisine, setCuisine] = useState('any');
  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleIngredientsExtracted = (newIngredients) => {
    setIngredients([...new Set([...ingredients, ...newIngredients])]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <Card>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
          Add Your Ingredients
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <VoiceInput onIngredientsExtracted={handleIngredientsExtracted} />
          <TextInput onIngredientsExtracted={handleIngredientsExtracted} />
        </div>

        <IngredientList ingredients={ingredients} onRemove={removeIngredient} />

        <div className="mb-4 sm:mb-6">
          <MoodSelector selectedMood={mood} onMoodChange={setMood} />
        </div>

        <div className="mb-4 sm:mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 text-sm sm:text-base">
            Cuisine Preference
          </h3>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 outline-none text-sm sm:text-base"
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
          className="w-full text-sm sm:text-base"
        >
          Generate Recipe
        </Button>
      </Card>
    </div>
  );
};

export default GenerateRecipePage;