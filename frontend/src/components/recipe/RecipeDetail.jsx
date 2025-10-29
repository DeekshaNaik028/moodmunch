// frontend/src/components/recipe/RecipeDetail.jsx - MOBILE + FAVORITES FIXED
import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Sparkles, Heart } from 'lucide-react';
import { Card } from '../common/Card';
import { NutritionInfo } from './NutritionInfo';
import { api } from '../../services/api';

export const RecipeDetail = ({ recipe, recipeId, onClose }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);

  useEffect(() => {
    const checkIfFavorited = async () => {
      if (!recipeId) {
        console.log('RecipeDetail: No recipeId provided');
        setCheckingFavorite(false);
        return;
      }

      try {
        console.log('RecipeDetail: Checking if favorited, ID:', recipeId);
        const result = await api.recipes.getFavorites();
        const favorites = result.favorites || [];
        const isInFavorites = favorites.some(fav => fav._id === recipeId);
        console.log('RecipeDetail: Is favorited:', isInFavorites);
        setIsFavorited(isInFavorites);
      } catch (err) {
        console.error('RecipeDetail: Error checking favorites:', err);
      } finally {
        setCheckingFavorite(false);
      }
    };

    checkIfFavorited();
  }, [recipeId]);

  const handleToggleFavorite = async () => {
    if (!recipeId) {
      alert('Cannot favorite this recipe. Recipe ID is missing.');
      return;
    }

    setFavoriting(true);
    try {
      console.log('RecipeDetail: Toggling favorite for ID:', recipeId);
      const result = await api.recipes.toggleFavorite(recipeId);
      console.log('RecipeDetail: Toggle result:', result);
      setIsFavorited(result.is_favorited);
      
      // Show success message
      const message = result.is_favorited 
        ? '❤️ Added to favorites!' 
        : '💔 Removed from favorites';
      
      // Create a temporary toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-medium';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 2000);
      
    } catch (err) {
      console.error('RecipeDetail: Favorite toggle error:', err);
      alert('Failed to update favorite: ' + err.message);
    } finally {
      setFavoriting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {recipe.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {recipe.description}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-start">
          {recipeId && (
            <button
              onClick={handleToggleFavorite}
              disabled={favoriting || checkingFavorite}
              className={`p-2 sm:p-3 rounded-xl transition-all ${
                isFavorited
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorited ? 'fill-current' : ''}`}
              />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Cards - Mobile Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="gradient-card rounded-xl p-3 sm:p-4 text-center">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
          <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.total_time}m
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Time</div>
        </div>
        <div className="gradient-card rounded-xl p-3 sm:p-4 text-center">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.servings}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Servings</div>
        </div>
        <div className="gradient-card rounded-xl p-3 sm:p-4 text-center">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
          <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white capitalize">
            {recipe.difficulty}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Difficulty</div>
        </div>
      </div>

      {/* Ingredients & Nutrition - Stack on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3">
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full mt-2"></span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        <NutritionInfo nutrition={recipe.nutrition_info} />
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3">
          Instructions
        </h3>
        <ol className="space-y-3">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="flex gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                {idx + 1}
              </span>
              <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
};