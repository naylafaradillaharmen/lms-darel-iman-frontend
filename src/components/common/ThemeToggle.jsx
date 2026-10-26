import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useAuth();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      aria-label="Toggle theme"
      className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center ${
        isDark
          ? 'bg-dei-dark-surface border-dei-dark-line text-dei-gold hover:bg-neutral-800'
          : 'bg-white border-dei-line text-dei-emerald hover:bg-dei-emerald-light'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-emerald-800" />
      )}
    </button>
  );
};

export default ThemeToggle;
