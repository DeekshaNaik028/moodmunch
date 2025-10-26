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
        const isInFavorites = favorites.some(fav => fav._id === recipeId);
        setIsFavorited(isInFavorites);
      } catch (err) {
        console.error('Error checking favorites:', err);
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
      const result = await api.recipes.toggleFavorite(recipeId);
      setIsFavorited(result.is_favorited);
    } catch (err) {
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
              className={`p-3 rounded-xl transition-all ${
                isFavorited
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`}
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
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
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