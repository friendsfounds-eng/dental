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

  const handleSelectTheme = (themeId) => {
    const updated = applyTheme(themeId);
    setActiveTheme(updated);
  };

  const isDark = activeTheme.id === 'dark';

  return (
    <div
      className={`flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs select-none ${className}`}
      role="group"
      aria-label="Theme mode selector"
    >
      {/* 1. Light Mode Option */}
      <button
        type="button"
        onClick={() => handleSelectTheme('light')}
        className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          !isDark
            ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80 font-black'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Switch to Clean Light Mode"
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-400/20' : ''}`} />
        <span className="hidden min-[480px]:inline text-[11px]">Light</span>
      </button>

      {/* 2. Dark Mode Option */}
      <button
        type="button"
        onClick={() => handleSelectTheme('dark')}
        className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          isDark
            ? 'bg-slate-900 text-blue-400 shadow-xs border border-slate-700 font-black'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Switch to Sleek Dark Mode"
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400 fill-blue-400/20' : ''}`} />
        <span className="hidden min-[480px]:inline text-[11px]">Dark</span>
      </button>
    </div>
  );
}
