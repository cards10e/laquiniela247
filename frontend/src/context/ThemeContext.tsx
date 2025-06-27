import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage, isValidTheme } from '../hooks/useLocalStorage';
import { useSystemTheme } from '../hooks/useSystemTheme';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Use type-safe localStorage hook with validation
  const [theme, setTheme] = useLocalStorage<Theme>('lq247_theme', 'auto', isValidTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  
  // Use system theme detection hook
  const { systemTheme } = useSystemTheme();

  // Update effective theme based on theme setting and system preference
  useEffect(() => {
    if (theme === 'auto') {
      setEffectiveTheme(systemTheme);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme, systemTheme]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  }, [effectiveTheme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    effectiveTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}