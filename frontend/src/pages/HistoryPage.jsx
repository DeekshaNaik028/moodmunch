import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { RecipeDetail } from '../components/recipe/RecipeDetail';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await api.recipes.getHistory(20);
        console.log('History - Fetched recipes:', result.recipes);
        setHistory(result.recipes || []);
      } catch (err) {
        console.error('History - Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleRecipeClick = (recipe, recipeId) => {
    console.log('History - Recipe clicked:', recipe.title, 'ID:', recipeId);
    setSelectedRecipe(recipe);
    setSelectedRecipeId(recipeId);
  };

  const handleClose = () => {
    console.log('History - Closing recipe detail');
    setSelectedRecipe(null);
    setSelectedRecipeId(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        recipeId={selectedRecipeId}
        onClose={handleClose}
      />
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Recipe History
      </h2>
      {history.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">
            No recipes yet. Start generating!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((item, idx) => {
            console.log('History - Rendering card:', item.recipe?.title, 'ID:', item._id);
            return (
              <RecipeCard
                key={item._id || idx}
                recipe={item.recipe}
                onClick={() => handleRecipeClick(item.recipe, item._id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
