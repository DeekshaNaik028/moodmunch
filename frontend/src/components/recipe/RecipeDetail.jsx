// frontend/src/components/recipe/RecipeDetail.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Sparkles, Heart, Share2, Copy, CheckCircle, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { NutritionInfo } from './NutritionInfo';
import { api } from '../../services/api';
import { Star } from 'lucide-react';

export const RecipeDetail = ({ recipe, recipeId, onClose, isFavoritedProp = null }) => {
  const [isFavorited, setIsFavorited] = useState(isFavoritedProp !== null ? isFavoritedProp : false);
  const [favoriting, setFavoriting] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(isFavoritedProp === null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [rating, setRating] = useState(recipe.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
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
  // Update the handleRate function to use themed notification
const handleRate = async (newRating) => {
  if (!recipeId) return;
  
  setIsRating(true);
  try {
    await api.recipes.rateRecipe(recipeId, newRating);
    setRating(newRating);
    
    // Create themed notification with animation
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down';
    notification.innerHTML = `
      <div class="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-lg border-2 border-white/20">
        <div class="flex gap-1">
          ${Array(newRating).fill('').map(() => '<span class="text-yellow-400 text-xl">⭐</span>').join('')}
        </div>
        <div class="border-l-2 border-white/30 pl-3">
          <div class="font-bold text-lg">Rated ${newRating} Star${newRating !== 1 ? 's' : ''}!</div>
          <div class="text-xs text-pink-100">Thank you for your feedback</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.animation = 'slide-up 0.5s ease-out forwards';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  } catch (err) {
    console.error('Failed to rate:', err);
    alert('Failed to rate recipe: ' + err.message);
  } finally {
    setIsRating(false);
  }
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
          {/* Share Button - THEMED VERSION */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
              title="Share recipe"
            >
              <Share2 className="w-6 h-6" />
            </button>

            {/* Share Menu - THEMED VERSION */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-pink-200 dark:border-pink-800 z-50 p-2 backdrop-blur-lg">
                <button
                  onClick={handleCopyRecipe}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 text-gray-800 dark:text-gray-200 transition-all group"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Copy Recipe</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 text-gray-800 dark:text-gray-200 transition-all group"
                >
                  <MessageCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={handleShareTwitter}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 text-gray-800 dark:text-gray-200 transition-all group"
                >
                  <Twitter className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Twitter</span>
                </button>

                <button
                  onClick={handleShareFacebook}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 text-gray-800 dark:text-gray-200 transition-all group"
                >
                  <Facebook className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
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
       {/* Rating Section - THEMED VERSION */}
      {recipeId && (
        <div className="mb-6 p-6 md:p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-pink-200 dark:border-pink-800 shadow-lg">
          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">
            How would you rate this recipe?
          </h3>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={isRating}
                className="transform transition-all duration-200 hover:scale-125 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-full p-1"
              >
                <Star
                  className={`w-10 h-10 md:w-12 md:h-12 transition-all duration-200 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                <div className="flex gap-1">
                  {Array(rating).fill('').map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  You rated this {rating} star{rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
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