import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  minimal?: boolean;
}

export function Header({ minimal = false }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  let navItems = [
    { key: 'dashboard', href: '/dashboard', label: t('navigation.dashboard') },
    { key: 'games', href: '/bet', label: t('navigation.games') },
    { key: 'history', href: '/history', label: t('navigation.history') },
    { key: 'profile', href: '/profile', label: t('navigation.profile') },
  ];

  const isAdmin = user?.role && user.role.toLowerCase() === 'admin';

  if (isAdmin) {
    navItems = [
      { key: 'admin', href: '/admin', label: t('navigation.admin_panel') },
      { key: 'games', href: '/bet', label: t('navigation.games') },
      { key: 'profile', href: '/profile', label: t('navigation.profile') },
    ];
  }

  return (
    <header className="bg-secondary-900 shadow-sm border-b border-secondary-700 !text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
              <img
                src="/logotipo-la-quiniela-247-min-2-1-1.png"
                alt="La Quiniela 247"
                className="h-10 w-30 object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!minimal && isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="text-secondary-100 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <LanguageToggle className="text-secondary-100 dark:text-white" />
            <ThemeToggle className="text-secondary-100 dark:text-white" />

            {/* User menu for authenticated users */}
            {!minimal && isAuthenticated && (
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm text-secondary-100 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={logout}
                  className="text-secondary-100 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('navigation.logout')}
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            {!minimal && isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary-100 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                  <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {!minimal && isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-secondary-200 dark:border-secondary-700">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="text-secondary-100 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4 pb-3">
                <div className="flex items-center px-3">
                  <span className="text-sm text-secondary-100 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-3 text-secondary-100 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
                >
                  {t('navigation.logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}