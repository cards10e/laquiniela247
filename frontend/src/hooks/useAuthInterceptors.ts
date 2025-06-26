import { useEffect } from 'react';
import { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

/**
 * Custom hook for managing Axios interceptors with guaranteed cleanup
 * 
 * CRITICAL SAFETY FIX: Prevents memory leaks from unregistered interceptors
 * 
 * Features:
 * - Automatic request token injection
 * - Token refresh on 401 errors
 * - Guaranteed cleanup on unmount
 * - Proper error handling and fallbacks
 * 
 * @param axiosInstance - The axios instance to configure
 */
export function useAuthInterceptors(axiosInstance: AxiosInstance): void {
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
              const response = await axiosInstance.post('/auth/refresh', { refreshToken });
              const { token } = response.data;
              
              // Set new token
              Cookies.set('auth_token', token, { expires: 7 });
              console.log('[Auth Debug] Token refreshed successfully');
              
              // Retry the original request with new token
              error.config.headers.Authorization = `Bearer ${token}`;
              return axiosInstance.request(error.config);
            } catch (refreshError) {
              console.error('[Auth Debug] Token refresh failed:', refreshError);
              // Refresh failed, logout user
              Cookies.remove('auth_token');
              Cookies.remove('refresh_token');
              
              if (typeof window !== 'undefined') {
                console.log('[Auth Debug] Redirecting to login due to refresh failure');
                window.location.href = '/login';
              }
            }
          } else {
            console.log('[Auth Debug] No refresh token available, redirecting to login');
            // No refresh token, redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
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
  }, [axiosInstance]);
} 