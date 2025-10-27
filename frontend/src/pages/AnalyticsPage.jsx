// ==========================================
// src/pages/AnalyticsPage.jsx - TOP 5 INGREDIENTS ONLY
// ==========================================
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
        console.log('Analytics data:', result);
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
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Analytics Dashboard
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
          <Utensils className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-4xl font-bold mb-1">
            {stats?.total_recipes_generated || 0}
          </div>
          <div className="text-pink-100 text-sm">Recipes Generated</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
          <Heart className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-4xl font-bold mb-1">
            {stats?.total_favorites || 0}
          </div>
          <div className="text-purple-100 text-sm">Favorites</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-4xl font-bold mb-1">
            {stats?.avg_cooking_time_minutes || 0}
          </div>
          <div className="text-indigo-100 text-sm">Avg Cook Time (min)</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-6 text-white shadow-xl">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-4xl font-bold mb-1">
            {stats?.unique_ingredients_used || 0}
          </div>
          <div className="text-blue-100 text-sm">Unique Ingredients</div>
        </div>
      </div>

      {/* Top 5 Ingredients - CHANGED FROM 10 TO 5 */}
      {stats?.top_ingredients && stats.top_ingredients.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Your Top 5 Ingredients
          </h3>
          <div className="space-y-3">
            {stats.top_ingredients.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 gradient-primary text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 dark:text-white capitalize">
                      {item.ingredient}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Used {item.usage_count} {item.usage_count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all"
                      style={{
                        width: `${
                          (item.usage_count / stats.top_ingredients[0].usage_count) *
                          100
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
        <Card className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Your Favorite Cuisine
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl">
              🍽️
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white capitalize">
                {stats.most_used_cuisine}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Your go-to choice
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {stats?.recent_recipes && stats.recent_recipes.length > 0 && (
        <Card>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {stats.recent_recipes.map((recipe, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {recipe.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mood: <span className="capitalize">{recipe.mood}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {stats?.total_recipes_generated === 0 && (
        <Card className="text-center py-12">
          <TrendingUp className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            No Analytics Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start generating recipes to see your cooking insights!
          </p>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;