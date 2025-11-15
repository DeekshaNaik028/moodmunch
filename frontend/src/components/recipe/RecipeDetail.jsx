// frontend/src/components/recipe/RecipeDetail.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Sparkles, Heart, Share2, Copy, CheckCircle, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { NutritionInfo } from './NutritionInfo';
import { api } from '../../services/api';

export const RecipeDetail = ({ recipe, recipeId, onClose, isFavoritedProp = null }) => {
  const [isFavorited, setIsFavorited] = useState(isFavoritedProp !== null ? isFavoritedProp : false);
  const [favoriting, setFavoriting] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(isFavoritedProp === null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isFavoritedProp !== null) {
      setIsFavorited(isFavoritedProp);
      setCheckingFavorite(false);
      return;
    }

    const checkIfFavorited = async () => {
      if (!recipeId) {
        setCheckingFavorite(false);
        return;
      }

      try {
        const result = await api.recipes.getFavorites();
        const favorites = result.favorites || [];
        const isInFavorites = favorites.some(fav => {
          const favId = fav._id || fav.id;
          return favId === recipeId;
        });
        setIsFavorited(isInFavorites);
      } catch (err) {
        console.error('Error checking favorites:', err);
      } finally {
        setCheckingFavorite(false);
      }
    };

    checkIfFavorited();
  }, [recipeId, isFavoritedProp]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    
    if (!recipeId) {
      alert('Cannot favorite this recipe. Recipe ID is missing.');
      return;
    }

    setFavoriting(true);
    try {
      const result = await api.recipes.toggleFavorite(recipeId);
      const newFavoriteState = result.is_favorited;
      setIsFavorited(newFavoriteState);
      
      const message = newFavoriteState 
        ? '❤️ Added to favorites!' 
        : '💔 Removed from favorites';
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-pink-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
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

  const generateRecipeText = () => {
    return `🍳 ${recipe.title}

${recipe.description}

⏱️ Prep: ${recipe.prep_time}m | Cook: ${recipe.cook_time}m | Total: ${recipe.total_time}m
👥 Servings: ${recipe.servings} | 📊 Difficulty: ${recipe.difficulty}

📝 INGREDIENTS:
${recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

👨‍🍳 INSTRUCTIONS:
${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

🔥 Calories: ${recipe.nutrition_info.calories} | Protein: ${recipe.nutrition_info.protein}g

${recipe.mood_message || ''}

Generated with MoodMunch 🍽️
`;
  };

  const handleCopyRecipe = async () => {
    try {
      const recipeText = generateRecipeText();
      await navigator.clipboard.writeText(recipeText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Failed to copy recipe');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this recipe: ${recipe.title}\n\nGenerated with MoodMunch 🍽️`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Just made "${recipe.title}" using @MoodMunch! 🍽️✨ AI-powered recipes based on mood and ingredients.`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <Card className="max-w-4xl mx-auto relative">
      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 pr-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {recipe.title}
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {recipe.description}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg"
              title="Share recipe"
            >
              <Share2 className="w-6 h-6" />
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-2">
                <button
                  onClick={handleCopyRecipe}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span className="text-sm font-medium">Copy Recipe</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={handleShareTwitter}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all"
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">Twitter</span>
                </button>

                <button
                  onClick={handleShareFacebook}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Facebook</span>
                </button>
              </div>
            )}
          </div>

          {/* Favorite Button */}
          {recipeId && (
            <button
              onClick={handleToggleFavorite}
              disabled={favoriting || checkingFavorite}
              className={`p-3 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                isFavorited
                  ? 'bg-pink-500 dark:bg-pink-600 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500'
              } ${favoriting ? 'opacity-50 cursor-wait' : ''}`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-6 h-6 transition-all ${
                  isFavorited ? 'fill-current' : ''
                }`}
              />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Recipe Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="gradient-card rounded-xl p-3 md:p-4 text-center">
          <Clock className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
          <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.total_time}m
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Time</div>
        </div>
        <div className="gradient-card rounded-xl p-3 md:p-4 text-center">
          <Users className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.servings}
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Servings</div>
        </div>
        <div className="gradient-card rounded-xl p-3 md:p-4 text-center">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
          <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white capitalize">
            {recipe.difficulty}
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Difficulty</div>
        </div>
      </div>

      {/* Ingredients and Nutrition */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-3">
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        <NutritionInfo nutrition={recipe.nutrition_info} />
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-3">
          Instructions
        </h3>
        <ol className="space-y-3">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                {idx + 1}
              </span>
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Mood Message - NEW SECTION */}
      {recipe.mood_message && (
        <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-pink-200 dark:border-pink-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
              💖
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                A Message for You
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {recipe.mood_message}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};