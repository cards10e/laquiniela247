import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { exchangeRateService } from '../services/exchangeRateService';

export type Currency = 'MXN' | 'USD' | 'USDT';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, originalCurrency?: Currency) => Promise<string>;
  getCurrencySymbol: () => string;
  convertAmount: (amount: number, from: Currency, to: Currency) => Promise<{ amount: number; rate: number; source: string; validated: boolean }>;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('MXN');

  // Load saved currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') as Currency;
    if (savedCurrency && ['MXN', 'USD', 'USDT'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
    
    // Disabled background refresh to prevent API rate limiting
    // Exchange rates will still be fetched on-demand with smart caching
    // const refreshId = exchangeRateService.startBackgroundRefresh();
    // 
    // return () => {
    //   // Clean up the interval when component unmounts
    //   if (refreshId) {
    //     clearInterval(refreshId);
    //   }
    // };
  }, []);

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'MXN':
        return '$';       // Mexican peso keeps the $ symbol
      case 'USD':
        return 'US$';     // US dollar gets US$ prefix to distinguish
      case 'USDT':
        return 'T$';      // USDT uses compact T$ prefix
      default:
        return '$';
    }
  };

  const formatAmount = async (amount: number, originalCurrency?: Currency): Promise<string> => {
    let displayAmount = amount;
    
    // Convert if different currency specified
    if (originalCurrency && originalCurrency !== currency) {
      try {
        const conversion = await exchangeRateService.convertCurrency(amount, originalCurrency, currency);
        displayAmount = conversion.amount;
      } catch (error) {
        console.warn('Currency conversion failed, showing original amount:', error);
        // Fallback to original amount if conversion fails
      }
    }
    
    const symbol = getCurrencySymbol();
    
    // All supported currencies use fiat/stablecoin formatting (2 decimal places)
    return `${symbol}${displayAmount.toFixed(2)}`;
  };

  const convertAmount = async (amount: number, from: Currency, to: Currency) => {
    const result = await exchangeRateService.convertCurrency(amount, from, to);
    
    // 🛡️ SECURITY: Log unvalidated conversions for monitoring
    if (!result.validated) {
      console.warn(`⚠️ Unvalidated currency conversion: ${amount} ${from} -> ${to} (source: ${result.source})`);
    }
    
    return result;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatAmount,
        getCurrencySymbol,
        convertAmount,
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