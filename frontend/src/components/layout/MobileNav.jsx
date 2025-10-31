// frontend/src/components/layout/MobileNav.jsx - NEW FILE
import React from 'react';
import { Home, Sparkles, BookOpen, Heart, TrendingUp, User } from 'lucide-react';

export const MobileNav = ({ currentPage, setCurrentPage }) => {
  const navigation = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'history', label: 'History', icon: BookOpen },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'analytics', label: 'Stats', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom">
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce-once' : ''}`} />
              <span className={`text-[10px] font-medium ${
                isActive ? 'font-bold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};