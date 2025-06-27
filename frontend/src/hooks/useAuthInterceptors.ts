import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

/**
 * Authentication failure reasons for proper error tracking
 */
type AuthFailureReason = 'refresh_failed' | 'no_refresh_token';

/**
 * Token refresh response interface
 */
interface TokenRefreshResponse {
  token: string;
}

/**
 * Enterprise-grade authentication interceptor hook with Next.js router integration
 * 
 * MICROSOFT-LEVEL SOLUTION: Proper integration with Next.js navigation patterns
 * 
 * Features:
 * - Next.js Router-aware navigation (prevents route abort errors)
 * - Automatic request token injection with type safety
 * - Smart token refresh with proper error handling
 * - Navigation state awareness (prevents race conditions)
 * - Guaranteed cleanup on unmount
 * - Production-ready error handling and fallbacks
 * 
 * @param axiosInstance - The axios instance to configure
 */
export function useAuthInterceptors(axiosInstance: AxiosInstance): void {
  const router = useRouter();

  // Enterprise-grade navigation handler that respects Next.js router state
  const handleAuthenticationFailure = useCallback(async (reason: AuthFailureReason) => {
    console.log(`[Auth Debug] Authentication failure: ${reason}`);
    
    // Clear auth state immediately
    Cookies.remove('auth_token');
    Cookies.remove('refresh_token');
    
    // Check if we're already on login page to prevent unnecessary redirects
    if (router.pathname === '/login') {
      console.log('[Auth Debug] Already on login page, skipping redirect');
      return;
    }
    
    // Check if router is ready and not currently navigating
    if (!router.isReady) {
      console.log('[Auth Debug] Router not ready, deferring navigation');
      // Wait for router to be ready, then navigate
      const checkRouter = () => {
        if (router.isReady) {
          router.push('/login');
        } else {
          setTimeout(checkRouter, 10);
        }
      };
      checkRouter();
      return;
    }
    
    try {
      // Use Next.js router for proper navigation (prevents abort errors)
      console.log('[Auth Debug] Initiating router-based navigation to login');
      await router.push('/login');
      console.log('[Auth Debug] Navigation to login completed successfully');
    } catch (navigationError) {
      console.error('[Auth Debug] Router navigation failed, falling back to window.location:', navigationError);
      // Fallback only if Next.js router fails (extremely rare)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [router]);

  useEffect(() => {
    console.log('[Auth Debug] Setting up interceptors via useAuthInterceptors hook');
    console.log('[Auth Debug] API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    // Request interceptor: Add auth token to all requests
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        const token = Cookies.get('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('[Auth Debug] auth_token cookie:', token);
        console.log('[Auth Debug] Request URL:', config.url);
        console.log('[Auth Debug] Request Headers:', config.headers);
        return config;
      },
      (error) => {
        console.error('[Auth Debug] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle token refresh on 401 errors
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('[Auth Debug] 401 error detected, attempting token refresh');
          
          // Try to refresh token
          const refreshToken = Cookies.get('refresh_token');
          if (refreshToken) {
            try {
              console.log('[Auth Debug] Attempting token refresh with refresh token');
              const response = await axiosInstance.post<TokenRefreshResponse>('/auth/refresh', { refreshToken });
              const { token } = response.data;
              
              // Set new token
              Cookies.set('auth_token', token, { expires: 7 });
              console.log('[Auth Debug] Token refreshed successfully');
              
              // Retry the original request with new token
              error.config.headers.Authorization = `Bearer ${token}`;
              return axiosInstance.request(error.config);
            } catch (refreshError) {
              console.error('[Auth Debug] Token refresh failed:', refreshError);
              // Use enterprise-grade navigation handler
              await handleAuthenticationFailure('refresh_failed');
            }
          } else {
            console.log('[Auth Debug] No refresh token available, redirecting to login');
            // Use enterprise-grade navigation handler
            await handleAuthenticationFailure('no_refresh_token');
          }
        }
        return Promise.reject(error);
      }
    );

    console.log('[Auth Debug] Interceptors registered:', {
      requestInterceptor,
      responseInterceptor
    });

    // CRITICAL: Guaranteed cleanup function
    return () => {
      console.log('[Auth Debug] Cleaning up interceptors...');
      
      // Eject both interceptors to prevent memory leaks
      if (requestInterceptor !== undefined) {
        axiosInstance.interceptors.request.eject(requestInterceptor);
        console.log('[Auth Debug] Request interceptor ejected');
      }
      
      if (responseInterceptor !== undefined) {
        axiosInstance.interceptors.response.eject(responseInterceptor);
        console.log('[Auth Debug] Response interceptor ejected');
      }
      
      console.log('[Auth Debug] All interceptors cleaned up successfully');
    };
  }, [axiosInstance, handleAuthenticationFailure]);
} 