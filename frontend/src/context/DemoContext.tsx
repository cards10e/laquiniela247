import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface DemoPreferences {
  endlessBetting: boolean;
}

interface DemoContextType {
  preferences: DemoPreferences;
  setEndlessBetting: (enabled: boolean) => void;
  isDemoUser: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_PREFERENCES_KEY = 'demo_preferences';

export function DemoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@laquiniela247.mx';
  
  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<DemoPreferences>(() => {
    if (typeof window === 'undefined') return { endlessBetting: false };
    const saved = localStorage.getItem(DEMO_PREFERENCES_KEY);
    return saved ? JSON.parse(saved) : { endlessBetting: false };
  });

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (isDemoUser) {
      localStorage.setItem(DEMO_PREFERENCES_KEY, JSON.stringify(preferences));
    }
  }, [preferences, isDemoUser]);

  const setEndlessBetting = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, endlessBetting: enabled }));
  };

  return (
    <DemoContext.Provider value={{ preferences, setEndlessBetting, isDemoUser }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
} 