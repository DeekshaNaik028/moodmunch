// frontend/src/components/auth/AuthScreen.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Logo } from '../common/Logo';
import { ChevronRight, ChevronLeft, Mail } from 'lucide-react';
import { DIETARY_PREFERENCES, HEALTH_GOALS } from '../../utils/constants';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dietary_preferences: [],
    allergies: [],
    health_goals: [],
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.auth.login({
          email: formData.email,
          password: formData.password,
        });
        login(response.access_token, response.user);
      } else {
        // Register with complete profile
        await api.auth.register(formData);
        // Show success message instead of auto-login
        setRegistrationSuccess(true);
      }
    } catch (err) {
      setError(err.message);
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

  const goToStep2 = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const renderRegistrationStep1 = () => (
    <form onSubmit={goToStep2} className="space-y-4">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Create Your Account
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Step 1 of 2: Basic Information
        </p>
      </div>

      <Input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <Input
        type="password"
        placeholder="Password (min. 8 characters)"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <Button type="submit" icon={ChevronRight} className="w-full">
        Continue to Profile Setup
      </Button>

      <button
        type="button"
        onClick={() => setIsLogin(true)}
        className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
      >
        Already have an account? Sign in
      </button>
    </form>
  );

  const renderRegistrationStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="mb-4 text-center sticky top-0 bg-white dark:bg-gray-800 pb-2 z-10">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Personalize Your Experience
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Step 2 of 2: Dietary Preferences (Optional)
        </p>
      </div>

      {/* Dietary Preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dietary Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREFERENCES.map((pref) => (
            <button
              key={pref}
              type="button"
              onClick={() => toggleDietaryPreference(pref)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Food Allergies
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="e.g., peanuts, shellfish"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAllergy();
              }
            }}
          />
          <Button type="button" onClick={addAllergy} variant="secondary">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.allergies.map((allergy, idx) => (
            <span
              key={idx}
              className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
            >
              {allergy}
              <button
                type="button"
                onClick={() => removeAllergy(allergy)}
                className="hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Health Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Health Goals
        </label>
        <div className="flex flex-wrap gap-2">
          {HEALTH_GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleHealthGoal(goal)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-gray-800 pt-2">
        <Button
          type="button"
          onClick={() => setStep(1)}
          variant="secondary"
          icon={ChevronLeft}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          Complete Registration
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        You can skip this step and update your preferences later
      </p>
    </form>
  );

  // Show registration success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Logo size="large" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              MoodMunch
            </h1>
          </div>

          <Card>
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Check Your Email! 📧
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've sent a verification link to:
              </p>
              <p className="font-semibold text-pink-600 dark:text-pink-400 mb-6">
                {formData.email}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Next Steps:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                  <li>Check your email inbox</li>
                  <li>Click the verification link</li>
                  <li>Come back and login</li>
                </ol>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or wait a few minutes.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsLogin(true);
                    setRegistrationSuccess(false);
                    setFormData({
                      email: '',
                      password: '',
                      name: '',
                      dietary_preferences: [],
                      allergies: [],
                      health_goals: [],
                    });
                  }}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <button
                  onClick={async () => {
                    try {
                      await api.auth.resendVerification(formData.email);
                      alert('Verification email resent!');
                    } catch (err) {
                      alert('Failed to resend: ' + err.message);
                    }
                  }}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main login/registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <Logo size="large" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            MoodMunch
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-Powered Recipe Recommendations
          </p>
        </div>

        <Card>
          {isLogin ? (
            <>
              <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className="flex-1 py-2 rounded-xl font-medium bg-white dark:bg-gray-600 shadow-md text-pink-600 dark:text-pink-400 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setStep(1);
                    setError('');
                  }}
                  className="flex-1 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-400 transition-all"
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full">
                  Sign In
                </Button>

                <button
                  type="button"
                  onClick={() => window.location.href = '/forgot-password'}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Forgot Password?
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl p-1">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setStep(1);
                    setError('');
                  }}
                  className="flex-1 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-400 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className="flex-1 py-2 rounded-xl font-medium bg-white dark:bg-gray-600 shadow-md text-pink-600 dark:text-pink-400 transition-all"
                >
                  Register
                </button>
              </div>

              {step === 1 ? renderRegistrationStep1() : renderRegistrationStep2()}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};