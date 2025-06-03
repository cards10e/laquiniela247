import React from 'react';
import { useI18n } from '@/context/I18nContext';

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center px-3 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
      aria-label={t('languages.switch_language')}
    >
      <span className="mr-2">🌐</span>
      {language === 'en' ? t('languages.english') : t('languages.spanish')}
    </button>
  );
}