import React, { useState } from 'react';
import { Lock, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Logo } from '../components/common/Logo';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!token) {
      setError('Invalid reset link');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
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
          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Password Reset Successful! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your password has been changed. You can now login with your new password.
              </p>
              <Button
                onClick={() => navigate('/login')}
                icon={ArrowRight}
                className="w-full"
              >
                Continue to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <Lock className="w-12 h-12 mx-auto mb-4 text-pink-600 dark:text-pink-400" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Reset Your Password
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Password Strength:
                    </div>
                    <div className="flex gap-2">
                      <div className={`h-2 flex-1 rounded-full ${
                        password.length >= 8 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                      <div className={`h-2 flex-1 rounded-full ${
                        password.length >= 12 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                      <div className={`h-2 flex-1 rounded-full ${
                        /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {password.length < 8 && '• At least 8 characters'}
                      {password.length >= 8 && password.length < 12 && '• Consider making it longer'}
                      {password.length >= 12 && '• Good length! '}
                      {!/[A-Z]/.test(password) && '• Add uppercase letters'}
                      {!/[0-9]/.test(password) && '• Add numbers'}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!password || !confirmPassword}
                  className="w-full"
                >
                  Reset Password
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Back to Login
                </button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};