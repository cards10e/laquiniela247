import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Header } from './Header';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  minimal?: boolean;
}

export function Layout({ children, title, description, minimal = false }: LayoutProps) {
  const { t } = useI18n();
  const { effectiveTheme } = useTheme();

  const pageTitle = title ? `${title} - ${t('common.app_name')}` : t('common.app_name');

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description || t('common.app_name')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff'} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <Header minimal={minimal} />
        <main className={minimal ? '' : 'pt-4'}>
          {children}
        </main>
      </div>
    </>
  );
}