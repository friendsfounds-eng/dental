// Theme Manager for Dental SaaS ERP
// Supports 2 clean themes: Light and Dark

export const THEMES = [
  {
    id: 'light',
    name: 'Light',
    subtitle: 'Crisp daylight clinic white & slate',
    badge: 'Day',
    iconName: 'Sun',
    bgPreview: '#f8fafc',
    cardPreview: '#ffffff',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    isDark: false
  },
  {
    id: 'dark',
    name: 'Dark',
    subtitle: 'Low-glare charcoal & slate operatory mode',
    badge: 'Night',
    iconName: 'Moon',
    bgPreview: '#0b1120',
    cardPreview: '#1e293b',
    accentColor: '#3b82f6',
    textColor: '#f8fafc',
    isDark: true
  }
];

export function applyTheme(themeId) {
  const root = document.documentElement;
  // Remove existing theme classes
  root.classList.remove('theme-light', 'theme-dark', 'theme-midnight', 'theme-teal', 'theme-amber', 'dark');

  // Normalize any legacy theme id to 'dark' or 'light'
  const normalizedId = (themeId === 'dark' || themeId === 'midnight' || themeId === 'teal' || themeId === 'amber')
    ? 'dark'
    : 'light';

  const selected = THEMES.find((t) => t.id === normalizedId) || THEMES[0];
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
      if (saved === 'dark' || saved === 'midnight' || saved === 'teal' || saved === 'amber') {
        return THEMES[1]; // Dark
      }
      return THEMES[0]; // Light
    }
  } catch (e) {
    // Ignore storage issues
  }
  return THEMES[0];
}

// Toggle between Light and Dark
export function toggleTheme() {
  const current = getCurrentTheme();
  const nextId = current.id === 'dark' ? 'light' : 'dark';
  return applyTheme(nextId);
}

// Initialize on script load
if (typeof window !== 'undefined') {
  const current = getCurrentTheme();
  applyTheme(current.id);
}
