import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'MXN' | 'USD' | 'BTC';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('MXN');

  // Load saved currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') as Currency;
    if (savedCurrency && ['MXN', 'USD', 'BTC'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'MXN':
        return '$';
      case 'USD':
        return '$';
      case 'BTC':
        return '₿';
      default:
        return '$';
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    
    if (currency === 'BTC') {
      // Bitcoin formatting with more decimal places
      return `${symbol}${amount.toFixed(8)}`;
    } else {
      // Fiat currency formatting
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatAmount,
        getCurrencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 