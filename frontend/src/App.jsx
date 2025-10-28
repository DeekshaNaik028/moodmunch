import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthScreen } from './components/auth/AuthScreen';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { NetworkStatus } from './components/common/NetworkStatus';

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <>
      <NetworkStatus />
      {isAuthenticated ? <AppLayout /> : <AuthScreen />}
    </>
  );
};

export default App;
