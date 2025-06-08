import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [axiosInstance] = useState(() => {
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  });

  useEffect(() => {
    console.log('[Auth Debug] Registering axios interceptors');
    
    // Add request interceptor
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

    // Add response interceptor to handle token refresh
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = Cookies.get('refresh_token');
          if (refreshToken) {
            try {
              const response = await axiosInstance.post('/api/auth/refresh', { refreshToken });
              const { token } = response.data;
              Cookies.set('auth_token', token, { expires: 7 });
              // Retry the original request
              error.config.headers.Authorization = `Bearer ${token}`;
              return axiosInstance.request(error.config);
            } catch (refreshError) {
              // Refresh failed, logout user
              Cookies.remove('auth_token');
              Cookies.remove('refresh_token');
              window.location.href = '/login';
            }
          } else {
            // No refresh token, redirect to login
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [axiosInstance]);

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
      const response = await axios.get('/api/users/profile');
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
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      const { tokens, user: userData } = response.data;
      const token = tokens.accessToken;
      const refreshToken = tokens.refreshToken;
      
      // Normalize role to lowercase
      const normalizedUser = { ...userData, role: userData.role?.toLowerCase() };
      
      // Set cookies with appropriate expiration
      const expires = remember ? 30 : 7; // 30 days if remember, 7 days otherwise
      Cookies.set('auth_token', token, { expires });
      if (refreshToken) {
        Cookies.set('refresh_token', refreshToken, { expires: 30 });
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
      const response = await axiosInstance.post('/api/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        termsAccepted: userData.termsAccepted,
        newsletter: userData.newsletter || false
      });

      const { token, refreshToken, user: newUser } = response.data;

      // Set cookies
      Cookies.set('auth_token', token, { expires: 7 });
      if (refreshToken) {
        Cookies.set('refresh_token', refreshToken, { expires: 30 });
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
      await axiosInstance.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshToken = async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axiosInstance.post('/api/auth/refresh', { refreshToken });
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
      const response = await axiosInstance.get('/api/auth/status');
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