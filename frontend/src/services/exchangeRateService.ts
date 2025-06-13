// Production-grade Exchange Rate Service
// Implements Microsoft Distinguished Engineer best practices

interface ExchangeRates {
  base: string;
  timestamp: number;
  rates: Record<string, number>;
  source: string;
}

interface CacheEntry {
  data: ExchangeRates;
  timestamp: number;
  ttl: number;
}

class ExchangeRateService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes fresh
  private readonly STALE_TTL = 30 * 60 * 1000; // 30 minutes stale tolerance
  private readonly MAX_TTL = 2 * 60 * 60 * 1000; // 2 hours absolute max

  private readonly providers = [
    {
      name: 'exchangerate-api',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      transform: (data: any) => ({
        base: data.base,
        timestamp: Date.now(),
        rates: data.rates,
        source: 'exchangerate-api'
      })
    },
    {
      name: 'fixer',
      url: `https://api.fixer.io/latest?access_key=${process.env.NEXT_PUBLIC_FIXER_API_KEY}`,
      transform: (data: any) => ({
        base: data.base,
        timestamp: Date.now(),
        rates: data.rates,
        source: 'fixer'
      })
    }
  ];

  // Fallback rates - updated monthly by DevOps
  private readonly fallbackRates = {
    base: 'USD',
    timestamp: Date.now(),
    rates: {
      USD: 1,
      MXN: 17.5,    // Approximate rates
      USDT: 1.001   // USDT slightly off peg
    },
    source: 'fallback'
  };

  async getExchangeRates(): Promise<ExchangeRates> {
    const cacheKey = 'exchange_rates';
    
    // 1. Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isFresh(cached)) {
      return cached.data;
    }

    // 2. Try to fetch from providers
    for (const provider of this.providers) {
      try {
        const rates = await this.fetchFromProvider(provider);
        this.updateCache(cacheKey, rates);
        return rates;
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // 3. Use stale cache if available
    if (cached && this.isStale(cached)) {
      console.warn('Using stale exchange rates');
      return cached.data;
    }

    // 4. Use fallback rates
    console.error('All exchange rate providers failed, using fallback');
    return this.fallbackRates;
  }

  private async fetchFromProvider(provider: any): Promise<ExchangeRates> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(provider.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LaQuiniela247/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return provider.transform(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isFresh(cached: CacheEntry): boolean {
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private isStale(cached: CacheEntry): boolean {
    return Date.now() - cached.timestamp < this.STALE_TTL;
  }

  private isExpired(cached: CacheEntry): boolean {
    return Date.now() - cached.timestamp > this.MAX_TTL;
  }

  private updateCache(key: string, data: ExchangeRates): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  // Convert between currencies with proper error handling
  async convertCurrency(
    amount: number, 
    from: string, 
    to: string
  ): Promise<{ amount: number; rate: number; source: string }> {
    if (from === to) {
      return { amount, rate: 1, source: 'identity' };
    }

    try {
      const rates = await this.getExchangeRates();
      
      // Convert via USD as base currency
      const fromRate = from === 'USD' ? 1 : rates.rates[from];
      const toRate = to === 'USD' ? 1 : rates.rates[to];

      if (!fromRate || !toRate) {
        throw new Error(`Unsupported currency pair: ${from} -> ${to}`);
      }

      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      const directRate = toRate / fromRate;

      return {
        amount: convertedAmount,
        rate: directRate,
        source: rates.source
      };
    } catch (error) {
      console.error('Currency conversion failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to convert ${from} to ${to}: ${errorMessage}`);
    }
  }

  // Background refresh for better UX
  startBackgroundRefresh(): void {
    setInterval(async () => {
      try {
        await this.getExchangeRates();
        console.log('Background exchange rate refresh completed');
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }, this.CACHE_TTL);
  }
}

export const exchangeRateService = new ExchangeRateService(); 