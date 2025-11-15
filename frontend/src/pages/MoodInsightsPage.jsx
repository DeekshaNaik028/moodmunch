// frontend/src/pages/MoodInsightsPage.jsx - NEW FILE
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Activity, Heart, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const MoodInsightsPage = () => {
  const [insights, setInsights] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchMoodData();
  }, [timeRange]);

  const fetchMoodData = async () => {
    setLoading(true);
    try {
      const [insightsData, historyData] = await Promise.all([
        api.mood.getMoodInsights(timeRange),
        api.mood.getMoodHistory(timeRange),
      ]);
      setInsights(insightsData);
      setHistory(historyData.logs || []);
    } catch (err) {
      console.error('Failed to fetch mood data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!insights || insights.total_logs === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Mood Insights
        </h2>
        <Card className="text-center py-20">
          <Brain className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            No Mood Data Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start tracking your daily mood to see personalized insights!
          </p>
        </Card>
      </div>
    );
  }

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      tired: '😴',
      stressed: '😰',
      calm: '😌',
      excited: '🤩',
      bored: '😑',
    };
    return emojis[mood] || '😊';
  };

  const getEnergyColor = (level) => {
    if (level >= 8) return 'from-green-500 to-emerald-600';
    if (level >= 5) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Mood Insights
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-pink-500 outline-none"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
          <Brain className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-4xl font-bold mb-2 flex items-center gap-2">
            {getMoodEmoji(insights.most_common_mood)}
            <span className="text-2xl capitalize">{insights.most_common_mood}</span>
          </div>
          <div className="text-purple-100 text-sm">Most Common Mood</div>
        </div>

        <div className={`bg-gradient-to-br ${getEnergyColor(insights.average_energy_level)} rounded-3xl p-6 text-white shadow-xl`}>
          <Activity className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-4xl font-bold mb-2">
            {insights.average_energy_level}/10
          </div>
          <div className="text-white/80 text-sm">Average Energy</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl">
          <Heart className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-4xl font-bold mb-2 capitalize">
            {insights.preferred_meal_type}
          </div>
          <div className="text-pink-100 text-sm">Preferred Meal Type</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-6 text-white shadow-xl">
          <Calendar className="w-8 h-8 mb-3 opacity-80" />
          <div className="text-4xl font-bold mb-2">
            {insights.logs_this_week}
          </div>
          <div className="text-blue-100 text-sm">Logs This Week</div>
        </div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            Energy Trend
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-6xl">{getTrendIcon(insights.energy_trend)}</div>
            <div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white capitalize">
                {insights.energy_trend}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {insights.energy_trend === 'increasing' && 'Your energy levels are improving! 🎉'}
                {insights.energy_trend === 'decreasing' && 'Consider rest and self-care 💙'}
                {insights.energy_trend === 'stable' && 'Maintaining consistent energy 👍'}
                {insights.energy_trend === 'not_enough_data' && 'Keep logging to see trends'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Mood Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(insights.mood_distribution || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([mood, count]) => (
                <div key={mood} className="flex items-center gap-3">
                  <div className="text-3xl">{getMoodEmoji(mood)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-white capitalize">
                        {mood}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} times
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full"
                        style={{
                          width: `${(count / insights.total_logs) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Recent Mood Logs
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.slice(0, 20).map((log, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{getMoodEmoji(log.mood)}</div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white capitalize">
                    {log.emotional_state || log.mood}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {log.date} at {log.time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Energy</div>
                  <div className="font-bold text-gray-800 dark:text-white">
                    {log.energy_level}/10
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Meal</div>
                  <div className="font-bold text-gray-800 dark:text-white capitalize">
                    {log.meal_preference}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MoodInsightsPage;