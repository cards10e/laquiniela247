import { useState, useCallback } from 'react';

/**
 * Type-safe localStorage hook with validation and error handling
 * Provides automatic JSON serialization/deserialization and runtime validation
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validator?: (value: any) => value is T
): [T, (value: T) => void, () => void] {
  // Initialize state with value from localStorage or default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      
      // Apply validator if provided
      if (validator && !validator(parsed)) {
        console.warn(`localStorage key "${key}" contains invalid value:`, parsed);
        return defaultValue;
      }
      
      return parsed as T;
    } catch (error) {
      console.warn(`Failed to parse localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Set value in localStorage and state
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set localStorage key "${key}":`, error);
    }
  }, [key]);

  // Remove value from localStorage and reset to default
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Validator function for Theme type
 * Ensures stored theme values are valid
 */
export const isValidTheme = (value: any): value is 'light' | 'dark' | 'auto' => {
  return typeof value === 'string' && ['light', 'dark', 'auto'].includes(value);
}; 