import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthInterceptors } from '../hooks/useAuthInterceptors';

console.log('[Auth Debug] AuthContext.tsx loaded');

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<User>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  newsletter?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [axiosInstance] = useState(() => {
    return axios.create({
      baseURL: '/api', // Use relative path for API requests
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  });

  // 🛡️ CRITICAL SAFETY FIX: Use custom hook for interceptor management
  // This prevents memory leaks from unregistered interceptors
  useAuthInterceptors(axiosInstance);

  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('/users/profile');
      // Normalize role to lowercase
      const normalizedUser = { ...response.data.user, role: response.data.user.role?.toLowerCase() };
      setUser(normalizedUser);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      if (typeof window !== 'undefined') {
        console.log('[Auth Debug] Removed auth_token and refresh_token due to failed fetchUser. Redirecting to /login in 3 seconds...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, remember = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { tokens, user: userData } = response.data;
      const token = tokens.accessToken;
      const refreshToken = tokens.refreshToken;
      
      // Normalize role to lowercase
      const normalizedUser = { ...userData, role: userData.role?.toLowerCase() };
      
      // Set cookies with appropriate expiration and domain
      const expires = remember ? 30 : 7; // 30 days if remember, 7 days otherwise
      const domain = process.env.NODE_ENV === 'production' ? '.laquiniela247demo.live' : undefined;
      Cookies.set('auth_token', token, { expires, domain });
      if (refreshToken) {
        Cookies.set('refresh_token', refreshToken, { expires: 30, domain });
      }
      
      setUser(normalizedUser);
      return normalizedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        termsAccepted: userData.termsAccepted,
        newsletter: userData.newsletter || false
      });

      const { token, refreshToken, user: newUser } = response.data;

      // Set cookies with domain
      const domain = process.env.NODE_ENV === 'production' ? '.laquiniela247demo.live' : undefined;
      Cookies.set('auth_token', token, { expires: 7, domain });
      if (refreshToken) {
        Cookies.set('refresh_token', refreshToken, { expires: 30, domain });
      }

      setUser(newUser);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear server-side cookies
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with cleanup even if backend call fails
    }

    try {
      // Clear client-side cookies with all possible domain variations
      const domain = process.env.NODE_ENV === 'production' ? '.laquiniela247demo.live' : undefined;
      
      // Remove cookies with domain
      Cookies.remove('auth_token', { domain });
      Cookies.remove('refresh_token', { domain });
      
      // Remove cookies without domain (fallback)
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      
      // Clear all local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Clear user state
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Use router for navigation instead of window.location
      if (typeof window !== 'undefined') {
        // Small delay to ensure state is cleared
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } catch (cleanupError) {
      console.error('Cleanup error during logout:', cleanupError);
      // Force redirect even if cleanup fails
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshToken = async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axiosInstance.post('/auth/refresh', { refreshToken });
      const { token } = response.data;
      Cookies.set('auth_token', token, { expires: 7 });
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/auth/status');
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    refreshToken,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}