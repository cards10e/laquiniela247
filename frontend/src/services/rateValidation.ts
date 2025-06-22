// 🛡️ SECURITY: Server-side rate validation utility
// Implements Microsoft-level security for currency operations

export interface ServerRateValidation {
  isValid: boolean;
  rate: number;
  confidence: number;
  source: string;
  timestamp: number;
  violations: string[];
}

export class ServerRateValidator {
  private static readonly CRITICAL_RATE_BOUNDARIES = {
    'USD/MXN': { min: 15.0, max: 25.0 },
    'USD/USDT': { min: 0.98, max: 1.05 },
    'MXN/USDT': { min: 15.0, max: 25.0 }
  };

  private static readonly MAX_DAILY_CHANGE = 0.15; // 15% max daily rate change
  private static readonly HIGH_VALUE_THRESHOLD = 10000; // $10K USD equivalent

  /**
   * 🛡️ SECURITY: Validate exchange rate for server-side financial operations
   * This should be called before ANY financial transaction processing
   */
  static validateRateForTransaction(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    rateSource: string
  ): ServerRateValidation {
    const violations: string[] = [];
    const pairKey = `${fromCurrency}/${toCurrency}`;
    const usdEquivalent = fromCurrency === 'USD' ? amount : amount / rate;

    // 1. Rate boundary validation
    const boundaries = (this.CRITICAL_RATE_BOUNDARIES as any)[pairKey];
    if (boundaries && (rate < boundaries.min || rate > boundaries.max)) {
      violations.push(`Rate ${rate} outside safe bounds [${boundaries.min}, ${boundaries.max}] for ${pairKey}`);
    }

    // 2. High-value transaction validation
    if (usdEquivalent > this.HIGH_VALUE_THRESHOLD) {
      if (rateSource.includes('fallback')) {
        violations.push(`High-value transaction ($${usdEquivalent}) blocked with fallback rate source`);
      }
      if (!rateSource.includes('consensus')) {
        violations.push(`High-value transaction requires consensus rate validation`);
      }
    }

    // 3. Source validation
    const trustedSources = ['consensus', 'exchangerate-api', 'fixer', 'coinapi'];
    const isTrustedSource = trustedSources.some(source => rateSource.includes(source));
    if (!isTrustedSource) {
      violations.push(`Untrusted rate source: ${rateSource}`);
    }

    // 4. Calculate confidence score
    let confidence = 1.0;
    if (rateSource.includes('fallback')) confidence *= 0.3;
    if (rateSource.includes('consensus')) confidence *= 1.2;
    if (violations.length > 0) confidence *= 0.5;

    const isValid = violations.length === 0;

    return {
      isValid,
      rate,
      confidence: Math.min(confidence, 1.0),
      source: rateSource,
      timestamp: Date.now(),
      violations
    };
  }

  /**
   * 🛡️ SECURITY: Environment validation for production
   */
  static validateEnvironmentSecurity(): {
    isSecure: boolean;
    warnings: string[];
    criticalIssues: string[];
  } {
    const warnings: string[] = [];
    const criticalIssues: string[] = [];

    // Check for required API keys
    if (!process.env.NEXT_PUBLIC_FIXER_API_KEY) {
      warnings.push('FIXER_API_KEY not set - reduced rate source diversity');
    }

    if (!process.env.NEXT_PUBLIC_COINAPI_KEY) {
      warnings.push('COINAPI_KEY not set - consensus validation may be limited');
    }

    // Check for production environment settings
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXT_PUBLIC_FIXER_API_KEY && !process.env.NEXT_PUBLIC_COINAPI_KEY) {
        criticalIssues.push('Production environment lacks backup rate sources');
      }
    }

    return {
      isSecure: criticalIssues.length === 0,
      warnings,
      criticalIssues
    };
  }
}

/**
 * 🛡️ SECURITY: Transaction amount limits for different risk levels
 */
export const TRANSACTION_LIMITS = {
  UNVALIDATED_RATE: 1000,    // $1K max with unvalidated rates
  FALLBACK_RATE: 500,        // $500 max with fallback rates  
  SINGLE_SOURCE: 5000,       // $5K max with single source
  CONSENSUS_VALIDATED: 50000, // $50K max with consensus validation
  HIGH_VALUE_MANUAL: 100000   // $100K+ requires manual approval
} as const;

/**
 * 🛡️ SECURITY: Get maximum allowed transaction amount based on rate validation
 */
export function getMaxTransactionAmount(validation: ServerRateValidation): number {
  if (!validation.isValid) return 0;
  
  if (validation.source.includes('fallback')) return TRANSACTION_LIMITS.FALLBACK_RATE;
  if (validation.source.includes('consensus')) return TRANSACTION_LIMITS.CONSENSUS_VALIDATED;
  if (validation.confidence < 0.8) return TRANSACTION_LIMITS.UNVALIDATED_RATE;
  
  return TRANSACTION_LIMITS.SINGLE_SOURCE;
} 