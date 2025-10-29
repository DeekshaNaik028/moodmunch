// frontend/src/components/layout/BottomNav.jsx
import React from 'react';
import { Home, Sparkles, BookOpen, Heart, TrendingUp, User } from 'lucide-react';

export const BottomNav = ({ currentPage, setCurrentPage }) => {
  const navigation = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'history', label: 'History', icon: BookOpen },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'analytics', label: 'Stats', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-50 safe-bottom">
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                isActive
                  ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};