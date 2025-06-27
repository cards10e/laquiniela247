import { useState, useEffect } from 'react';

export type SystemTheme = 'light' | 'dark';

interface UseSystemThemeResult {
  systemTheme: SystemTheme;
  isSupported: boolean;
}

/**
 * Hook for detecting and tracking system theme preference
 * Provides automatic cleanup of media query listeners
 */
export function useSystemTheme(): UseSystemThemeResult {
  // Check if matchMedia is supported (SSR/old browser compatibility)
  const isSupported = typeof window !== 'undefined' && !!window.matchMedia;

  const [systemTheme, setSystemTheme] = useState<SystemTheme>(() => {
    if (!isSupported) return 'light';
    
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch (error) {
      console.warn('Failed to detect system theme preference:', error);
      return 'light';
    }
  });

  useEffect(() => {
    if (!isSupported) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme);

    // Initial check (in case the state changed since initialization)
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Guaranteed cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, [isSupported]);

  return {
    systemTheme,
    isSupported
  };
} 