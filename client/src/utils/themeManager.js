// Theme Manager for Dental SaaS ERP
// Supports Light, Dark, Midnight Blue, Emerald Care, and Warm Amber Eye-Care

export const THEMES = [
  {
    id: 'light',
    name: 'Clean Light',
    subtitle: 'Crisp daylight clinic white & slate',
    badge: 'Standard',
    iconName: 'Sun',
    bgPreview: '#f8fafc',
    cardPreview: '#ffffff',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    isDark: false
  },
  {
    id: 'dark',
    name: 'Sleek Dark',
    subtitle: 'Low-glare charcoal & slate operatory mode',
    badge: 'Night Care',
    iconName: 'Moon',
    bgPreview: '#0b1120',
    cardPreview: '#1e293b',
    accentColor: '#3b82f6',
    textColor: '#f8fafc',
    isDark: true
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    subtitle: 'Deep sapphire navy with cyan clinical accents',
    badge: 'High Contrast',
    iconName: 'Sparkles',
    bgPreview: '#040812',
    cardPreview: '#0b162c',
    accentColor: '#06b6d4',
    textColor: '#e0f2fe',
    isDark: true
  },
  {
    id: 'teal',
    name: 'Emerald Care',
    subtitle: 'Soothing mint & forest slate clinical spa tone',
    badge: 'Wellness',
    iconName: 'HeartPulse',
    bgPreview: '#04120e',
    cardPreview: '#0a251d',
    accentColor: '#10b981',
    textColor: '#ecfdf5',
    isDark: true
  },
  {
    id: 'amber',
    name: 'Warm Eye-Care',
    subtitle: 'Soft warm sepia tone reducing blue light fatigue',
    badge: 'Eye Comfort',
    iconName: 'Flame',
    bgPreview: '#14110e',
    cardPreview: '#241f1a',
    accentColor: '#f59e0b',
    textColor: '#fef3c7',
    isDark: true
  }
];

export function applyTheme(themeId) {
  const root = document.documentElement;
  // Remove existing theme classes
  THEMES.forEach((t) => {
    root.classList.remove(`theme-${t.id}`);
  });
  root.classList.remove('dark');

  const selected = THEMES.find((t) => t.id === themeId) || THEMES[0];
  root.classList.add(`theme-${selected.id}`);
  if (selected.isDark) {
    root.classList.add('dark');
  }
  root.setAttribute('data-theme', selected.id);

  try {
    localStorage.setItem('dental_erp_theme', selected.id);
  } catch (e) {
    console.warn('Could not save theme preference to localStorage', e);
  }

  // Notify listeners across app
  window.dispatchEvent(new CustomEvent('dental-theme-changed', { detail: selected.id }));
  return selected;
}

export function getCurrentTheme() {
  try {
    const saved = localStorage.getItem('dental_erp_theme');
    if (saved) {
      const match = THEMES.find((t) => t.id === saved);
      if (match) return match;
    }
  } catch (e) {
    // Ignore storage issues
  }
  return THEMES[0];
}

// Initialize on script load
if (typeof window !== 'undefined') {
  const current = getCurrentTheme();
  applyTheme(current.id);
}
