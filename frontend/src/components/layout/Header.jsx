// frontend/src/components/layout/Header.jsx - MOBILE RESPONSIVE
import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '../common/Logo';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="glass border-b border-white/50 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Logo size="default" className="w-8 h-8 md:w-12 md:h-12" />
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
              MoodMunch
            </h1>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px] md:max-w-none">
              Hi, {user?.name?.split(' ')[0]}!
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm md:text-base">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};