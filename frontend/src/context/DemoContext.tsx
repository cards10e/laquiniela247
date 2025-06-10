import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface DemoContextType {
  isDemoUser: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@laquiniela247.mx';

  return (
    <DemoContext.Provider value={{ isDemoUser }}>
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