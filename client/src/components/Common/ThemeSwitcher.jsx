import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  HeartPulse,
  Flame,
  Check,
  ChevronDown,
  Palette
} from 'lucide-react';
import { THEMES, getCurrentTheme, applyTheme } from '../../utils/themeManager';

const ICON_MAP = {
  Sun,
  Moon,
  Sparkles,
  HeartPulse,
  Flame
};

export default function ThemeSwitcher({ className = '' }) {
  const [activeTheme, setActiveTheme] = useState(getCurrentTheme());
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleThemeChange = (e) => {
      const match = THEMES.find((t) => t.id === e.detail);
      if (match) setActiveTheme(match);
    };

    window.addEventListener('dental-theme-changed', handleThemeChange);
    return () => window.removeEventListener('dental-theme-changed', handleThemeChange);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelectTheme = (themeId) => {
    const updated = applyTheme(themeId);
    setActiveTheme(updated);
    setOpen(false);
  };

  const ActiveIcon = ICON_MAP[activeTheme.iconName] || Palette;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Theme Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white/90 hover:bg-white text-slate-700 transition shadow-2xs group text-xs font-bold"
        title={`Current UI Theme: ${activeTheme.name} (Click to change)`}
      >
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12"
          style={{ backgroundColor: `${activeTheme.accentColor}25`, color: activeTheme.accentColor }}
        >
          <ActiveIcon className="w-3 h-3" />
        </div>
        <span className="hidden min-[480px]:inline truncate max-w-[85px] sm:max-w-none text-slate-800">
          {activeTheme.name}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Theme Selection Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-fadeIn divide-y divide-slate-100">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>UI Theme & Appearance</span>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {THEMES.length} Themes
            </span>
          </div>

          <div className="py-1.5 space-y-1">
            {THEMES.map((theme) => {
              const isSelected = activeTheme.id === theme.id;
              const Icon = ICON_MAP[theme.iconName] || Palette;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Live Theme Color Swatch Preview */}
                    <div
                      className="w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-xs relative overflow-hidden"
                      style={{
                        backgroundColor: theme.bgPreview,
                        borderColor: theme.accentColor
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-md flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: theme.cardPreview, color: theme.accentColor }}
                      >
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {theme.name}
                        </span>
                        {theme.badge && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border"
                            style={{
                              backgroundColor: `${theme.accentColor}15`,
                              color: theme.accentColor,
                              borderColor: `${theme.accentColor}30`
                            }}
                          >
                            {theme.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                        {theme.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator Checkmark */}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2 text-[10px] text-slate-400 flex items-center justify-between bg-slate-50/70 rounded-xl mt-1">
            <span>Theme auto-saves to your browser</span>
            <span className="font-semibold text-slate-500">Live Preview</span>
          </div>
        </div>
      )}
    </div>
  );
}
