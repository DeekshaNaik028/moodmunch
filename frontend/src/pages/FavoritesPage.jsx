// frontend/src/pages/FavoritesPage.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../services/api';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { RecipeDetail } from '../components/recipe/RecipeDetail';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const result = await api.recipes.getFavorites();
      console.log('Favorites - Fetched:', result.favorites);
      setFavorites(result.favorites || []);
    } catch (err) {
      console.error('Favorites - Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRecipeClick = (recipe, recipeId) => {
    console.log('Favorites - Recipe clicked:', recipe.title, 'ID:', recipeId);
    setSelectedRecipe(recipe);
    setSelectedRecipeId(recipeId);
  };

  const handleClose = () => {
    console.log('Favorites - Closing recipe detail');
    setSelectedRecipe(null);
    setSelectedRecipeId(null);
    // Refresh favorites list in case something was unfavorited
    fetchFavorites();
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
        // CRITICAL: Tell RecipeDetail that this recipe IS favorited
        isFavoritedProp={true}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Favorite Recipes
        </h2>
        <div className="bg-pink-100 dark:bg-pink-900/30 px-4 py-2 rounded-full">
          <span className="text-pink-600 dark:text-pink-400 font-semibold">
            {favorites.length} {favorites.length === 1 ? 'Recipe' : 'Recipes'}
          </span>
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-pink-400 dark:text-pink-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            No Favorites Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Heart some recipes from your history to see them here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((item, idx) => {
            console.log('Favorites - Rendering card:', item.recipe?.title, 'ID:', item._id);
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

export default FavoritesPage;