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
        // Demo users go to games page, regular users go to dashboard
        router.replace(isDemoUser ? '/bet' : '/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, isDemoUser, router]);

  // Show loading spinner while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="spinner"></div>
    </div>
  );
}