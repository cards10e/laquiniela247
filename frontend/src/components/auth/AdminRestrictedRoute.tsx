import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AdminRestrictedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * 🔒 AdminRestrictedRoute Component
 * 
 * Restricts admin users from accessing user-specific pages.
 * Redirects admins to their dedicated admin panel.
 * 
 * Usage:
 * <AdminRestrictedRoute>
 *   <UserOnlyPageContent />
 * </AdminRestrictedRoute>
 */
export function AdminRestrictedRoute({ 
  children, 
  redirectTo = '/admin' 
}: AdminRestrictedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role && user.role.toLowerCase() === 'admin';
  
  useEffect(() => {
    // Only redirect if user is authenticated and is admin
    if (isAuthenticated && isAdmin) {
      console.log('[AdminRestrictedRoute] Redirecting admin user to:', redirectTo);
      window.location.href = redirectTo;
      return;
    }
  }, [isAuthenticated, isAdmin, redirectTo]);
  
  // Show content only for non-admin users
  // If admin, component will redirect before this renders
  if (isAuthenticated && isAdmin) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-secondary-600 dark:text-secondary-400">
            Redirecting to Admin Panel...
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 