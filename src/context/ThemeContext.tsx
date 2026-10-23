// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppTheme = 'industrial-slate' | 'light-manufacturing';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  themeLabel: string;
}

const THEME_STORAGE_KEY = 'voltedge_theme';
const LEGACY_THEME_STORAGE_KEY = 'voltmax_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (stored === 'light-manufacturing' || stored === 'industrial-slate') {
        return stored;
      }
    } catch (e) {
      // localStorage may fail in restricted iframes
    }
    return 'industrial-slate';
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'industrial-slate') {
      root.classList.add('dark');
      root.classList.remove('theme-light');
      root.classList.add('theme-slate');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
    } else {
      root.classList.remove('dark');
      root.classList.remove('theme-slate');
      root.classList.add('theme-light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'industrial-slate' ? 'light-manufacturing' : 'industrial-slate'));
  };

  const isDark = theme === 'industrial-slate';
  const themeLabel = isDark ? 'Industrial Slate' : 'Light Manufacturing';

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme, themeLabel }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
