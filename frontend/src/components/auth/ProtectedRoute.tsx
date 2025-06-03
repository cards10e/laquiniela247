import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        const returnUrl = router.asPath;
        router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }

      if (requireAdmin && user?.role !== 'admin') {
        // Redirect to dashboard if not admin
        router.replace('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, user, loading, router, requireAdmin]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="spinner"></div>
      </div>
    );
  }

  // Don't render children if not authenticated or not admin when required
  if (!isAuthenticated || (requireAdmin && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="spinner"></div>
      </div>
    );
  }

  return <>{children}</>;
}