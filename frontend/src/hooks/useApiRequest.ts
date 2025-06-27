import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface UseApiRequestOptions {
  immediate?: boolean;
  dependencies?: any[];
  axiosConfig?: AxiosRequestConfig;
}

interface UseApiRequestResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancel: () => void;
}

/**
 * Custom hook for making API requests with automatic cleanup and type safety
 * Prevents memory leaks and race conditions by managing AbortController
 */
export function useApiRequest<T>(
  url: string | (() => string), 
  options: UseApiRequestOptions = {}
): UseApiRequestResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      
      const requestUrl = typeof url === 'function' ? url() : url;
      const response: AxiosResponse<T> = await axios.get(requestUrl, {
        signal: controller.signal,
        ...options.axiosConfig
      });
      
      // Only update state if request wasn't aborted
      if (!controller.signal.aborted) {
        setData(response.data);
      }
    } catch (err: any) {
      // Don't handle AbortError - it's expected when cancelling requests
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        const errorMessage = err.response?.data?.error || err.message || 'Request failed';
        setError(errorMessage);
        console.error('API request failed:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [url, options.axiosConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-fetch based on dependencies
  useEffect(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  }, options.dependencies || [url]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { data, loading, error, refetch: fetchData, cancel };
} 