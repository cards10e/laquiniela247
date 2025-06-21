import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { isDemoUser } = useDemo();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // All authenticated users go to betting page first
        router.replace('/bet');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="spinner"></div>
    </div>
  );
}