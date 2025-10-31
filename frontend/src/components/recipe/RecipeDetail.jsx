// frontend/src/components/recipe/RecipeDetail.jsx - FIXED VERSION
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
        setCheckingFavorite(false);
        return;
      }

      try {
        const result = await api.recipes.getFavorites();
        const favorites = result.favorites || [];
        
        // Check if current recipe is in favorites
        const isInFavorites = favorites.some(fav => {
          const favId = fav._id || fav.id;
          return favId === recipeId;
        });
        
        console.log('Recipe Detail - Checking favorite:', {
          recipeId,
          favoriteIds: favorites.map(f => f._id || f.id),
          isInFavorites
        });
        
        setIsFavorited(isInFavorites);
      } catch (err) {
        console.error('Error checking favorites:', err);
      } finally {
        setCheckingFavorite(false);
      }
    };

    checkIfFavorited();
  }, [recipeId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent any parent click handlers
    
    if (!recipeId) {
      alert('Cannot favorite this recipe. Recipe ID is missing.');
      return;
    }

    setFavoriting(true);
    try {
      const result = await api.recipes.toggleFavorite(recipeId);
      
      console.log('Recipe Detail - Toggle result:', result);
      
      // Update local state immediately
      setIsFavorited(result.is_favorited);
      
      // Show feedback
      const message = result.is_favorited 
        ? '❤️ Added to favorites!' 
        : '💔 Removed from favorites';
      
      // Create a temporary notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-pink-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to update favorite:', err);
      alert('Failed to update favorite: ' + err.message);
    } finally {
      setFavoriting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {recipe.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{recipe.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {recipeId && (
            <button
              onClick={handleToggleFavorite}
              disabled={favoriting || checkingFavorite}
              className={`p-3 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                isFavorited
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 shadow-lg'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500'
              } ${favoriting ? 'opacity-50 cursor-wait' : ''}`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-6 h-6 transition-all ${
                  isFavorited ? 'fill-current animate-pulse' : ''
                }`}
              />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="gradient-card rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.total_time}m
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
        </div>
        <div className="gradient-card rounded-xl p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.servings}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Servings</div>
        </div>
        <div className="gradient-card rounded-xl p-4 text-center">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
          <div className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
            {recipe.difficulty}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Difficulty</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full mt-2"></span>
                <span className="text-gray-700 dark:text-gray-300">{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        <NutritionInfo nutrition={recipe.nutrition_info} />
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
          Instructions
        </h3>
        <ol className="space-y-3">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-300 pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
};