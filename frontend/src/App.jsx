// frontend/src/App.jsx - UPDATED WITHOUT ADMIN
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthScreen } from './components/auth/AuthScreen';
import LandingPage from './pages/LandingPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { NetworkStatus } from './components/common/NetworkStatus';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { ResendVerificationPage } from './pages/ResendVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

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
    <BrowserRouter>
      <NetworkStatus />
      <Routes>
        {/* Public Landing Page */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/app" /> : <LandingPage />} 
        />
        
        {/* Auth routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/app" /> : <AuthScreen />} 
        />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected app routes */}
        <Route 
          path="/app/*" 
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />} 
        />
        
        {/* Fallback - redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;