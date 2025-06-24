/**
 * Enterprise-Level Navigation Configuration
 * Handles production-specific routing requirements, CDN cache busting,
 * and Cloudflare proxy compatibility
 */

export interface NavigationConfig {
  enableClientSideNavigation: boolean;
  fallbackToWindowLocation: boolean;
  retryNavigationOnFailure: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enableNavigationLogging: boolean;
  preloadCriticalRoutes: boolean;
  cacheBustingEnabled: boolean;
}

// Production-optimized configuration
const PRODUCTION_CONFIG: NavigationConfig = {
  enableClientSideNavigation: true,
  fallbackToWindowLocation: true,
  retryNavigationOnFailure: true,
  maxRetryAttempts: 3,
  retryDelay: 100,
  enableNavigationLogging: true,
  preloadCriticalRoutes: true,
  cacheBustingEnabled: true,
};

// Development configuration
const DEVELOPMENT_CONFIG: NavigationConfig = {
  enableClientSideNavigation: true,
  fallbackToWindowLocation: false,
  retryNavigationOnFailure: false,
  maxRetryAttempts: 1,
  retryDelay: 0,
  enableNavigationLogging: true,
  preloadCriticalRoutes: false,
  cacheBustingEnabled: false,
};

// Get configuration based on environment
export function getNavigationConfig(): NavigationConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
}

// Critical routes that should be preloaded in production
export const CRITICAL_ROUTES = [
  '/bet',
  '/dashboard', 
  '/history',
  '/profile',
  '/admin'
];

// Routes that require authentication
export const AUTHENTICATED_ROUTES = [
  '/bet',
  '/dashboard',
  '/history', 
  '/profile',
  '/admin'
];

// Cache busting utility for production
export function addCacheBustingParam(url: string): string {
  const config = getNavigationConfig();
  
  if (!config.cacheBustingEnabled) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  return `${url}${separator}_t=${timestamp}`;
}

// Navigation retry utility
export async function retryNavigation(
  navigationFn: () => Promise<boolean>,
  config: NavigationConfig = getNavigationConfig()
): Promise<boolean> {
  if (!config.retryNavigationOnFailure) {
    return navigationFn();
  }

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxRetryAttempts; attempt++) {
    try {
      const success = await navigationFn();
      if (success) {
        if (config.enableNavigationLogging && attempt > 1) {
          console.log(`[Navigation] Retry successful on attempt ${attempt}`);
        }
        return true;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Navigation failed');
      
      if (config.enableNavigationLogging) {
        console.warn(`[Navigation] Attempt ${attempt} failed:`, error);
      }

      // Wait before retry (except on last attempt)
      if (attempt < config.maxRetryAttempts && config.retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  if (config.enableNavigationLogging) {
    console.error(`[Navigation] All ${config.maxRetryAttempts} attempts failed:`, lastError);
  }

  return false;
}

// Route preloading utility
export function preloadCriticalRoutes(): void {
  const config = getNavigationConfig();
  
  if (!config.preloadCriticalRoutes || typeof window === 'undefined') {
    return;
  }

  // Use requestIdleCallback if available, otherwise setTimeout
  const preload = () => {
    CRITICAL_ROUTES.forEach(route => {
      // Preload via link prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);

      // Log preloading in development
      if (config.enableNavigationLogging) {
        console.log(`[Navigation] Preloading route: ${route}`);
      }
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 1000);
  }
}

// Hydration detection utility
export function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Check if React has finished hydrating
    const checkHydration = () => {
      // Multiple checks for hydration completion
      const isHydrated = (
        document.readyState === 'complete' &&
        // Check if React event handlers are attached
        document.querySelector('[data-reactroot]') !== null &&
        // Ensure Next.js router is ready
        (window as any).__NEXT_DATA__ !== undefined
      );

      if (isHydrated) {
        resolve();
      } else {
        setTimeout(checkHydration, 10);
      }
    };

    checkHydration();
  });
}

// Enhanced navigation logger
export function logNavigation(
  action: string,
  data: Record<string, any>,
  config: NavigationConfig = getNavigationConfig()
): void {
  if (!config.enableNavigationLogging) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    environment: process.env.NODE_ENV,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ...data
  };

  console.log(`[Navigation:${action}]`, logEntry);
} 