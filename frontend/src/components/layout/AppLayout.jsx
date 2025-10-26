import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import HomePage from '../../pages/HomePage';
import GenerateRecipePage from '../../pages/GenerateRecipePage';
import HistoryPage from '../../pages/HistoryPage';
import FavoritesPage from '../../pages/FavoritesPage';
import AnalyticsPage from '../../pages/AnalyticsPage';
import ProfilePage from '../../pages/ProfilePage';

export const AppLayout = () => {
  const [currentPage, setCurrentPage] = useState('generate');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setPage={setCurrentPage} />;
      case 'generate':
        return <GenerateRecipePage />;
      case 'history':
        return <HistoryPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <GenerateRecipePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <Header />
      <div className="flex max-w-7xl mx-auto">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 p-4 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};