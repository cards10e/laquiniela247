import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

export function ThemeToggle() {
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
      className="flex items-center px-3 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
      aria-label={t('themes.toggle_theme')}
      title={getThemeLabel()}
    >
      <span className="mr-2">{getThemeIcon()}</span>
      {getThemeLabel()}
    </button>
  );
}