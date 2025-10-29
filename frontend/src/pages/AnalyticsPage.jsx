// frontend/src/pages/AnalyticsPage.jsx - MOBILE RESPONSIVE
import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, Clock, Utensils } from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.analytics.getDashboard();
        setStats(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        Analytics Dashboard
      </h2>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl">
          <Utensils className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
          <div className="text-2xl sm:text-4xl font-bold mb-1">
            {stats?.total_recipes_generated || 0}
          </div>
          <div className="text-pink-100 text-xs sm:text-sm">Recipes</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl">
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
          <div className="text-2xl sm:text-4xl font-bold mb-1">
            {stats?.total_favorites || 0}
          </div>
          <div className="text-purple-100 text-xs sm:text-sm">Favorites</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl">
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
          <div className="text-2xl sm:text-4xl font-bold mb-1">
            {stats?.avg_cooking_time_minutes || 0}
          </div>
          <div className="text-indigo-100 text-xs sm:text-sm">Avg Min</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
          <div className="text-2xl sm:text-4xl font-bold mb-1">
            {stats?.unique_ingredients_used || 0}
          </div>
          <div className="text-blue-100 text-xs sm:text-sm">Ingredients</div>
        </div>
      </div>

      {/* Top 5 Ingredients */}
      {stats?.top_ingredients && stats.top_ingredients.length > 0 && (
        <Card className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
            Your Top 5 Ingredients
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {stats.top_ingredients.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-medium text-gray-800 dark:text-white capitalize text-sm sm:text-base truncate">
                      {item.ingredient}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.usage_count}x
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all"
                      style={{
                        width: `${
                          (item.usage_count / stats.top_ingredients[0].usage_count) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Most Used Cuisine */}
      {stats?.most_used_cuisine && (
        <Card className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
            Your Favorite Cuisine
          </h3>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl">
              🍽️
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white capitalize">
                {stats.most_used_cuisine}
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Your go-to choice
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity - Mobile Optimized */}
      {stats?.recent_recipes && stats.recent_recipes.length > 0 && (
        <Card>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
            Recent Activity
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {stats.recent_recipes.map((recipe, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">
                    {recipe.title}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Mood: <span className="capitalize">{recipe.mood}</span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 self-end sm:self-auto">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {stats?.total_recipes_generated === 0 && (
        <Card className="text-center py-8 sm:py-12">
          <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
            No Analytics Yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Start generating recipes to see your cooking insights!
          </p>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;