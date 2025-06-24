import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { 
  getNavigationConfig, 
  retryNavigation, 
  logNavigation, 
  waitForHydration,
  preloadCriticalRoutes,
  AUTHENTICATED_ROUTES 
} from '@/utils/navigationConfig';

interface NavigationState {
  isNavigating: boolean;
  lastNavigation: string | null;
  navigationError: string | null;
}

interface NavigationOptions {
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  ensureAuthenticated?: boolean;
}

export function useClientNavigation() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    lastNavigation: null,
    navigationError: null,
  });

  // Track if component is mounted and hydrated
  const [isHydrated, setIsHydrated] = useState(false);
  const config = getNavigationConfig();

  useEffect(() => {
    // Enterprise-level hydration detection
    const initializeNavigation = async () => {
      try {
        await waitForHydration();
        setIsHydrated(true);
        
        // Preload critical routes in production
        preloadCriticalRoutes();
        
        logNavigation('SYSTEM_READY', {
          isAuthenticated,
          currentPath: router.asPath,
          config: config,
        });
      } catch (error) {
        console.error('[Navigation] Initialization failed:', error);
        // Fallback: set hydrated after timeout
        setTimeout(() => setIsHydrated(true), 1000);
      }
    };

    initializeNavigation();
  }, [isAuthenticated, router.asPath, config]);

  // Enterprise-level navigation handler with comprehensive error handling
  const navigateTo = useCallback(
    async (href: string, options: NavigationOptions = {}) => {
      const {
        replace = false,
        scroll = true,
        shallow = false,
        ensureAuthenticated = AUTHENTICATED_ROUTES.includes(href),
      } = options;

      // Reset any previous errors
      setNavigationState(prev => ({ ...prev, navigationError: null }));

      // Log navigation attempt
      logNavigation('NAVIGATE_ATTEMPT', {
        href,
        options,
        currentPath: router.asPath,
        isAuthenticated,
        authLoading,
        isHydrated,
      });

      // Validation Phase 1: Configuration Check
      if (!config.enableClientSideNavigation) {
        logNavigation('NAVIGATE_FALLBACK_WINDOW', { href, reason: 'Client-side navigation disabled' });
        if (typeof window !== 'undefined') {
          window.location.href = href;
          return true;
        }
        return false;
      }

      // Validation Phase 2: Hydration Check
      if (!isHydrated) {
        logNavigation('NAVIGATE_BLOCKED', { href, reason: 'Not hydrated' });
        setNavigationState(prev => ({ 
          ...prev, 
          navigationError: 'Navigation blocked: Component not hydrated' 
        }));
        return false;
      }

      // Validation Phase 3: Authentication Check
      if (ensureAuthenticated && authLoading) {
        logNavigation('NAVIGATE_DEFERRED', { href, reason: 'Auth loading' });
        // Retry after auth loads
        setTimeout(() => navigateTo(href, options), 100);
        return false;
      }

      if (ensureAuthenticated && !isAuthenticated) {
        logNavigation('NAVIGATE_AUTH_REQUIRED', { href });
        setNavigationState(prev => ({ 
          ...prev, 
          navigationError: 'Authentication required' 
        }));
        return false;
      }

      // Validation Phase 4: URL Validation
      if (!href || typeof href !== 'string') {
        logNavigation('NAVIGATE_INVALID_URL', { href });
        setNavigationState(prev => ({ 
          ...prev, 
          navigationError: 'Invalid navigation target' 
        }));
        return false;
      }

      // Validation Phase 5: Current Route Check
      if (router.asPath === href) {
        logNavigation('NAVIGATE_SAME_ROUTE', { href });
        return true;
      }

      // Set navigation state
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        lastNavigation: href,
      }));

      // Execute navigation with retry mechanism
      const executeNavigation = async (): Promise<boolean> => {
        try {
          logNavigation('NAVIGATE_EXECUTE', {
            href,
            replace,
            scroll,
            shallow,
            currentPath: router.asPath,
          });

          // Execute navigation
          if (replace) {
            await router.replace(href, undefined, { scroll, shallow });
          } else {
            await router.push(href, undefined, { scroll, shallow });
          }

          logNavigation('NAVIGATE_SUCCESS', { href });
          
          // Clear navigation state on success
          setNavigationState(prev => ({
            ...prev,
            isNavigating: false,
            navigationError: null,
          }));

          return true;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown navigation error';
          
          logNavigation('NAVIGATE_ERROR', { 
            href, 
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          });
          
          setNavigationState(prev => ({
            ...prev,
            isNavigating: false,
            navigationError: errorMessage,
          }));

          // Try fallback if configured
          if (config.fallbackToWindowLocation && typeof window !== 'undefined') {
            logNavigation('NAVIGATE_FALLBACK_ATTEMPT', { href });
            try {
              window.location.href = href;
              return true;
            } catch (windowError) {
              logNavigation('NAVIGATE_FALLBACK_FAILED', { 
                href, 
                error: windowError instanceof Error ? windowError.message : 'Unknown error' 
              });
            }
          }

          return false;
        }
      };

      // Execute with retry mechanism
      return await retryNavigation(executeNavigation, config);
    },
    [router, isAuthenticated, authLoading, isHydrated, config]
  );

  // Convenience methods for common navigation patterns
  const navigateWithReplace = useCallback(
    (href: string) => navigateTo(href, { replace: true }),
    [navigateTo]
  );

  const navigateWithoutScroll = useCallback(
    (href: string) => navigateTo(href, { scroll: false }),
    [navigateTo]
  );

  const navigateShallow = useCallback(
    (href: string) => navigateTo(href, { shallow: true }),
    [navigateTo]
  );

  // Public API
  return {
    // Core navigation function
    navigateTo,
    
    // Convenience methods
    navigateWithReplace,
    navigateWithoutScroll,
    navigateShallow,
    
    // Navigation state
    isNavigating: navigationState.isNavigating,
    lastNavigation: navigationState.lastNavigation,
    navigationError: navigationState.navigationError,
    
    // Hydration state
    isHydrated,
    
    // Router state
    currentPath: router.asPath,
    isReady: router.isReady,
  };
} 