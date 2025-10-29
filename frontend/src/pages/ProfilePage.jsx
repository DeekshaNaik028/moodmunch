// frontend/src/pages/ProfilePage.jsx - MOBILE RESPONSIVE
import React, { useState, useEffect } from 'react';
import { User, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { DIETARY_PREFERENCES, HEALTH_GOALS } from '../utils/constants';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dietary_preferences: [],
    allergies: [],
    health_goals: [],
  });
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dietary_preferences: user.dietary_preferences || [],
        allergies: user.allergies || [],
        health_goals: user.health_goals || [],
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.users.updateProfile(formData);
      alert('Profile updated successfully!');
      setEditing(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryPreference = (pref) => {
    setFormData({
      ...formData,
      dietary_preferences: formData.dietary_preferences.includes(pref)
        ? formData.dietary_preferences.filter((p) => p !== pref)
        : [...formData.dietary_preferences, pref],
    });
  };

  const toggleHealthGoal = (goal) => {
    setFormData({
      ...formData,
      health_goals: formData.health_goals.includes(goal)
        ? formData.health_goals.filter((g) => g !== goal)
        : [...formData.health_goals, goal],
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, newAllergy.trim()],
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((a) => a !== allergy),
    });
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        Profile
      </h2>

      <Card>
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {user.name}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              icon={Edit2}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Edit Profile
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            {/* Dietary Preferences - Mobile Grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietaryPreference(pref)}
                    className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      formData.dietary_preferences.includes(pref)
                        ? 'gradient-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pref.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Allergies
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add an allergy"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  className="text-sm"
                />
                <Button type="button" onClick={addAllergy} variant="primary">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Health Goals - Mobile Grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Health Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {HEALTH_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleHealthGoal(goal)}
                    className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      formData.health_goals.includes(goal)
                        ? 'gradient-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {goal.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons - Stack on Mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="submit"
                loading={loading}
                icon={Save}
                className="flex-1 w-full"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={() => setEditing(false)}
                variant="secondary"
                icon={X}
                className="flex-1 w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Info Cards - Stack on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="gradient-card rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Dietary Preferences
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.dietary_preferences.length > 0 ? (
                    formData.dietary_preferences.map((pref, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs sm:text-sm"
                      >
                        {pref.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      None set
                    </span>
                  )}
                </div>
              </div>

              <div className="gradient-card rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Allergies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.length > 0 ? (
                    formData.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs sm:text-sm"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      None set
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="gradient-card rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                Health Goals
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.health_goals.length > 0 ? (
                  formData.health_goals.map((goal, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs sm:text-sm"
                    >
                      {goal.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    None set
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;