import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { isDemoUser } = useDemo();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Microsoft-level navigation: Check if router is ready and avoid race conditions
    if (!loading && router.isReady && !redirecting) {
      setRedirecting(true);
      
      const performNavigation = async () => {
        try {
          if (isAuthenticated) {
            console.log('[Navigation] Authenticated user detected, navigating to /bet');
            // Use replace to avoid back button confusion
            await router.replace('/bet');
          } else {
            console.log('[Navigation] Unauthenticated user detected, navigating to /login');
            await router.replace('/login');
          }
        } catch (navigationError) {
          console.error('[Navigation] Navigation failed:', navigationError);
          // Reset redirect state to allow retry
          setRedirecting(false);
        }
      };

      performNavigation();
    }
  }, [isAuthenticated, loading, router, redirecting]);

  // Show loading spinner while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="spinner"></div>
    </div>
  );
}