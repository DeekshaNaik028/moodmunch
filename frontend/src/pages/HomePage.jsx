import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { RecipeDetail } from '../components/recipe/RecipeDetail';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const HomePage = ({ setPage }) => {
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const history = await api.recipes.getHistory(5);
        console.log('Home - Fetched recipes:', history.recipes);
        setRecentRecipes(history.recipes || []);
      } catch (err) {
        console.error('Home - Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRecipeClick = (recipe, recipeId) => {
    console.log('Recipe clicked:', recipe.title, 'ID:', recipeId);
    setSelectedRecipe(recipe);
    setSelectedRecipeId(recipeId);
  };

  const handleClose = () => {
    console.log('Closing recipe detail');
    setSelectedRecipe(null);
    setSelectedRecipeId(null);
  };

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
    <div className="space-y-6">
      <div className="gradient-primary rounded-3xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">
          Ready to Cook Something Amazing?
        </h2>
        <p className="text-pink-100 mb-6">
          Tell us what you have, and we'll create the perfect recipe for your mood!
        </p>
        <Button
          onClick={() => setPage('generate')}
          icon={Sparkles}
          variant="secondary"
        >
          Generate Recipe
        </Button>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Recent Recipes
        </h3>
        {loading ? (
          <LoadingSpinner />
        ) : recentRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentRecipes.map((item, idx) => {
              console.log('Rendering recipe card:', item.recipe?.title, 'ID:', item._id);
              return (
                <RecipeCard
                  key={item._id || idx}
                  recipe={item.recipe}
                  onClick={() => handleRecipeClick(item.recipe, item._id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p>No recipes yet. Generate your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
