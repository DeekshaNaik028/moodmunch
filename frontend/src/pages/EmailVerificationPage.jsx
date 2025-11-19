import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';

export const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setVerifying(false);
      setError('No verification token provided');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmail = async () => {
    try {
      const result = await api.auth.verifyEmail(token);
      setSuccess(true);
      setError('');
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setSuccess(false);
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
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
          {verifying ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-pink-600 dark:text-pink-400 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Email Verified! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your email has been successfully verified. You can now login and start using MoodMunch!
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
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => navigate('/resend-verification')}
                  variant="secondary"
                  className="w-full"
                >
                  Request New Link
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};