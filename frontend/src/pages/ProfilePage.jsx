// frontend/src/pages/ProfilePage.jsx - FULLY RESPONSIVE VERSION
import React, { useState, useEffect } from 'react';
import { User, Edit2, Save, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { DIETARY_PREFERENCES, HEALTH_GOALS } from '../utils/constants';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
      const updatedUser = await api.users.getProfile();
      const token = localStorage.getItem('token');
      login(token, updatedUser);
      
      setShowSuccess(true);
      setEditing(false);
      
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
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
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
      {/* Success Banner */}
      {showSuccess && (
        <div className="mb-3 md:mb-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-xl p-3 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-green-800 dark:text-green-300">
              Profile Updated!
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">
              Your changes have been saved.
            </p>
          </div>
        </div>
      )}

      <h2 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3 md:mb-6 px-2 sm:px-0">
        Profile
      </h2>

      <Card className="mx-2 sm:mx-0">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 gradient-primary rounded-full flex items-center justify-center text-white text-xl md:text-2xl lg:text-3xl font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white truncate">
                {user.name}
              </h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              icon={Edit2}
              variant="outline"
              className="flex-shrink-0 text-xs md:text-sm px-2 py-1.5 md:px-4 md:py-2"
            >
              <span className="hidden sm:inline">Edit</span>
              <Edit2 className="w-4 h-4 sm:hidden" />
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="text-sm md:text-base py-2 md:py-3"
              />
            </div>

            {/* Dietary Preferences */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {DIETARY_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietaryPreference(pref)}
                    className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                      formData.dietary_preferences.includes(pref)
                        ? 'gradient-primary text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {pref.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allergies
              </label>
              <div className="flex gap-1.5 md:gap-2 mb-2">
                <Input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                  className="text-xs md:text-sm py-2"
                />
                <Button 
                  type="button" 
                  onClick={addAllergy} 
                  variant="primary"
                  className="px-3 md:px-4 text-xs md:text-sm"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium flex items-center gap-1.5 max-w-full"
                  >
                    <span className="truncate">{allergy}</span>
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Health Goals */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Health Goals
              </label>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {HEALTH_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleHealthGoal(goal)}
                    className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                      formData.health_goals.includes(goal)
                        ? 'gradient-primary text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {goal.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={Save}
                className="flex-1 order-2 sm:order-1 text-sm md:text-base py-2 md:py-3"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: user.name || '',
                    dietary_preferences: user.dietary_preferences || [],
                    allergies: user.allergies || [],
                    health_goals: user.health_goals || [],
                  });
                }}
                variant="secondary"
                icon={X}
                className="flex-1 order-1 sm:order-2 text-sm md:text-base py-2 md:py-3"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-3 md:space-y-4">
            {/* Dietary Preferences Card */}
            <div className="gradient-card rounded-lg md:rounded-xl p-3 md:p-4">
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Dietary Preferences
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {formData.dietary_preferences.length > 0 ? (
                  formData.dietary_preferences.map((pref, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 md:px-2.5 md:py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-[10px] md:text-xs font-medium"
                    >
                      {pref.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    None set
                  </span>
                )}
              </div>
            </div>

            {/* Allergies Card */}
            <div className="gradient-card rounded-lg md:rounded-xl p-3 md:p-4">
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Allergies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {formData.allergies.length > 0 ? (
                  formData.allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 md:px-2.5 md:py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-[10px] md:text-xs font-medium truncate max-w-full"
                    >
                      {allergy}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    None set
                  </span>
                )}
              </div>
            </div>

            {/* Health Goals Card */}
            <div className="gradient-card rounded-lg md:rounded-xl p-3 md:p-4">
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Health Goals
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {formData.health_goals.length > 0 ? (
                  formData.health_goals.map((goal, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 md:px-2.5 md:py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-[10px] md:text-xs font-medium"
                    >
                      {goal.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
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