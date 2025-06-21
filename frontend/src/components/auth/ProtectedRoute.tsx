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
        // Clean redirect to login without exposing protected URLs
        router.replace('/login');
        return;
      }

      // Case-insensitive admin check
      if (requireAdmin && (!user?.role || user.role.toLowerCase() !== 'admin')) {
        // Redirect to betting page if not admin
        router.replace('/bet');
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
  if (!isAuthenticated || (requireAdmin && (!user?.role || user.role.toLowerCase() !== 'admin'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="spinner"></div>
      </div>
    );
  }

  return <>{children}</>;
}