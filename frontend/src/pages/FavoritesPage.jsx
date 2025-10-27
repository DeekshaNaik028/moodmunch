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
    // Refresh favorites list
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
      />
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Favorite Recipes
      </h2>
      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">
            No favorites yet. Heart some recipes from your history!
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