import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { t } = useI18n();

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'auto'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'auto') {
      return effectiveTheme === 'dark' ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeLabel = () => {
    return t(`themes.${theme}`);
  };

  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-primary-600 dark:hover:text-primary-400 ${className}`}
      aria-label={t('themes.toggle_theme')}
      title={getThemeLabel()}
    >
      <span className="mr-2">{getThemeIcon()}</span>
      {getThemeLabel()}
    </button>
  );
}