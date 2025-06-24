import React, { useCallback } from 'react';
import { useClientNavigation } from '@/hooks/useClientNavigation';

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  replace?: boolean;
  prefetch?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

export function NavigationLink({
  href,
  children,
  className = '',
  onClick,
  replace = false,
  prefetch = false,
  disabled = false,
  'aria-label': ariaLabel,
}: NavigationLinkProps) {
  const { navigateTo, isNavigating, isHydrated, currentPath } = useClientNavigation();

  // Determine if this link is currently active
  const isActive = currentPath === href;

  // Enhanced click handler with enterprise-level error handling
  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent default button behavior
      event.preventDefault();
      event.stopPropagation();

      // Execute custom onClick if provided
      if (onClick) {
        try {
          onClick();
        } catch (error) {
          console.error('[NavigationLink] Custom onClick error:', error);
        }
      }

      // Skip navigation if disabled or already navigating
      if (disabled || isNavigating) {
        console.warn('[NavigationLink] Navigation skipped - disabled or in progress');
        return;
      }

      // Skip if already on target route
      if (isActive) {
        console.log('[NavigationLink] Already on target route:', href);
        return;
      }

      // Execute navigation
      const success = await navigateTo(href, { replace });
      
      if (!success) {
        console.error('[NavigationLink] Navigation failed for:', href);
      }
    },
    [href, onClick, disabled, isNavigating, isActive, navigateTo, replace]
  );

  // Enhanced keyboard navigation support
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick(event as any);
      }
    },
    [handleClick]
  );

  // Determine button state classes
  const getButtonClasses = () => {
    let classes = className;
    
    if (disabled || !isHydrated) {
      classes += ' opacity-50 cursor-not-allowed';
    } else if (isNavigating) {
      classes += ' opacity-75 cursor-wait';
    } else {
      classes += ' cursor-pointer';
    }

    if (isActive) {
      classes += ' bg-primary-600 text-white';
    }

    return classes;
  };

  // Show loading indicator during navigation
  const renderContent = () => {
    if (isNavigating) {
      return (
        <span className="flex items-center">
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      );
    }

    return children;
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={getButtonClasses()}
      disabled={disabled || !isHydrated || isNavigating}
      aria-label={ariaLabel || `Navigate to ${href}`}
      aria-current={isActive ? 'page' : undefined}
      type="button"
      role="link"
    >
      {renderContent()}
    </button>
  );
} 