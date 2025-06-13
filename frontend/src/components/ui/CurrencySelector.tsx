import { useCurrency, Currency } from '@/context/CurrencyContext';
import { useI18n } from '@/context/I18nContext';

interface CurrencySelectorProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function CurrencySelector({ className = '', size = 'md' }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  const { t } = useI18n();

  const currencies: Currency[] = ['MXN', 'USD', 'USDT'];

  const sizeClasses = {
    sm: 'text-xs px-1 py-1',
    md: 'text-sm px-3 py-2'
  };

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
      className={`form-input ${sizeClasses[size]} ${className}`}
      aria-label={t('betting.currency')}
    >
      {currencies.map((curr) => (
        <option key={curr} value={curr}>
          {t(`betting.${curr.toLowerCase()}`)}
        </option>
      ))}
    </select>
  );
} 