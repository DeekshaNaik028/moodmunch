// frontend/src/pages/ProfilePage.jsx - MOBILE RESPONSIVE VERSION
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
    <div className="max-w-4xl mx-auto">
      {/* Success Banner */}
      {showSuccess && (
        <div className="mb-4 md:mb-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base text-green-800 dark:text-green-300">
              Profile Updated Successfully!
            </p>
            <p className="text-xs md:text-sm text-green-700 dark:text-green-400">
              Your changes have been saved.
            </p>
          </div>
        </div>
      )}

      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">
        Profile
      </h2>

      <Card>
        <div className="flex items-start md:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <div className="w-14 h-14 md:w-20 md:h-20 gradient-primary rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">
                {user.name}
              </h3>
              <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              icon={Edit2}
              variant="outline"
              className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3"
            >
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietaryPreference(pref)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                      formData.dietary_preferences.includes(pref)
                        ? 'gradient-primary text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pref.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                Allergies
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add an allergy"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                  className="text-sm md:text-base"
                />
                <Button 
                  type="button" 
                  onClick={addAllergy} 
                  variant="primary"
                  className="px-4 md:px-6"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-2"
                  >
                    <span className="truncate max-w-[150px]">{allergy}</span>
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                Health Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {HEALTH_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleHealthGoal(goal)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                      formData.health_goals.includes(goal)
                        ? 'gradient-primary text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {goal.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={Save}
                className="flex-1 order-2 sm:order-1"
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
                className="flex-1 order-1 sm:order-2"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="gradient-card rounded-xl p-3 md:p-4">
                <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-white mb-2 md:mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                  Dietary Preferences
                </h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {formData.dietary_preferences.length > 0 ? (
                    formData.dietary_preferences.map((pref, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 md:px-3 md:py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs md:text-sm font-medium"
                      >
                        {pref.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                      None set
                    </span>
                  )}
                </div>
              </div>

              <div className="gradient-card rounded-xl p-3 md:p-4">
                <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-white mb-2 md:mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                  Allergies
                </h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {formData.allergies.length > 0 ? (
                    formData.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 md:px-3 md:py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs md:text-sm font-medium truncate max-w-full"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                      None set
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="gradient-card rounded-xl p-3 md:p-4">
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-white mb-2 md:mb-3 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Health Goals
              </h4>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {formData.health_goals.length > 0 ? (
                  formData.health_goals.map((goal, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 md:px-3 md:py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs md:text-sm font-medium"
                    >
                      {goal.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
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