import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Logo } from '../components/common/Logo';

export const ResendVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.auth.resendVerification(email);
      setSuccess(true);
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
              <Mail className="w-16 h-16 mx-auto mb-4 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                If an account exists with this email, we've sent a new verification link.
              </p>
              <Button
                onClick={() => navigate('/login')}
                variant="secondary"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <Mail className="w-12 h-12 mx-auto mb-4 text-pink-600 dark:text-pink-400" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Resend Verification Email
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your email and we'll send you a new verification link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Send Verification Email
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