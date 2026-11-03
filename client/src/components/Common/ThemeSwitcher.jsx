import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { THEMES, getCurrentTheme, applyTheme } from '../../utils/themeManager';

export default function ThemeSwitcher({ className = '' }) {
  const [activeTheme, setActiveTheme] = useState(getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (e) => {
      const match = THEMES.find((t) => t.id === e.detail);
      if (match) setActiveTheme(match);
    };

    window.addEventListener('dental-theme-changed', handleThemeChange);
    return () => window.removeEventListener('dental-theme-changed', handleThemeChange);
  }, []);

  const isDark = activeTheme.id === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    const updated = applyTheme(nextTheme);
    setActiveTheme(updated);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400 hover:text-amber-300'
          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
      } ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
