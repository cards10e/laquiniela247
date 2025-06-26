import { useEffect, useRef, useCallback } from 'react';

interface SecurityMetrics {
  suspiciousRequests: number;
  failedLogins: number;
  lastUpdate: Date;
}

interface UseSecurityMonitoringOptions {
  /** Interval in milliseconds for security checks (default: 30000 = 30 seconds) */
  interval?: number;
  /** Whether monitoring is enabled (default: true) */
  enabled?: boolean;
  /** Callback for when security metrics are updated */
  onMetricsUpdate?: (metrics: SecurityMetrics) => void;
  /** Callback for when security alerts are detected */
  onSecurityAlert?: (alertType: string, details: any) => void;
}

/**
 * Custom hook for admin security monitoring with automatic cleanup
 * Prevents memory leaks by properly managing intervals and cleanup
 */
export const useSecurityMonitoring = (options: UseSecurityMonitoringOptions = {}) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onMetricsUpdate,
    onSecurityAlert
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef<SecurityMetrics>({
    suspiciousRequests: 0,
    failedLogins: 0,
    lastUpdate: new Date()
  });

  const performSecurityCheck = useCallback(async () => {
    try {
      // Simulate security metrics collection
      // In a real implementation, this would make API calls to collect metrics
      const newMetrics: SecurityMetrics = {
        suspiciousRequests: Math.floor(Math.random() * 10),
        failedLogins: Math.floor(Math.random() * 5),
        lastUpdate: new Date()
      };

      metricsRef.current = newMetrics;

      // Check for security alerts
      if (newMetrics.suspiciousRequests > 5) {
        onSecurityAlert?.('HIGH_SUSPICIOUS_REQUESTS', {
          count: newMetrics.suspiciousRequests,
          threshold: 5
        });
      }

      if (newMetrics.failedLogins > 3) {
        onSecurityAlert?.('HIGH_FAILED_LOGINS', {
          count: newMetrics.failedLogins,
          threshold: 3
        });
      }

      // Notify about metrics update
      onMetricsUpdate?.(newMetrics);

    } catch (error) {
      onSecurityAlert?.('MONITORING_ERROR', error);
    }
  }, [onMetricsUpdate, onSecurityAlert]);

  const startMonitoring = useCallback(() => {
    if (!enabled) return;

    // Perform initial check
    performSecurityCheck();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(performSecurityCheck, interval);
  }, [enabled, interval, performSecurityCheck]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      stopMonitoring();
    };
  }, [enabled, startMonitoring, stopMonitoring]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    /** Current security metrics */
    metrics: metricsRef.current,
    /** Manually trigger a security check */
    performCheck: performSecurityCheck,
    /** Start monitoring (if not already started) */
    startMonitoring,
    /** Stop monitoring */
    stopMonitoring,
    /** Whether monitoring is currently active */
    isMonitoring: intervalRef.current !== null
  };
}; 