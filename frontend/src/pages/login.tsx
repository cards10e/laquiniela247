import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const redirectTo = (router.query.redirect as string) || '/dashboard';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = t('auth.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.email_invalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.password_required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.password_min_length');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password, formData.remember);
      
      toast.success(t('auth.login_success'));
      
      const redirectTo = (router.query.redirect as string) || '/dashboard';
      router.push(redirectTo);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t('auth.login_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title={t('auth.login')} description={t('auth.login_description')} minimal>
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('auth.login')} description={t('auth.login_description')} minimal>
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/logotipo-la-quiniela-247-min-2-1-1.png"
              alt="La Quiniela 247"
              className="h-16 w-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-center text-3xl font-bold text-primary-600 dark:text-primary-400 mb-8">
            {t('auth.login')}
          </h1>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-secondary-800 py-8 px-6 shadow-lg rounded-xl border border-secondary-200 dark:border-secondary-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="form-label">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder={t('auth.email_placeholder')}
                />
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="form-label">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder={t('auth.password_placeholder')}
                />
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                  {t('auth.remember_me')}
                </label>
              </div>

              {/* Register Link */}
              <div className="text-right">
                <Link 
                  href="/register"
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  {t('auth.no_account_register')}
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn-primary w-full ${isSubmitting ? 'btn-disabled' : ''}`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="spinner-sm mr-2"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  t('auth.login')
                )}
              </button>
            </form>

            {/* Demo Information */}
            <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700">
              <h3 className="text-center text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
                {t('common.demo_information')}
              </h3>
              <p className="text-center text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                {t('common.demo_environment_notice')}
              </p>
              <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
                {t('common.demo_account_available')}: <br />
                <strong>demo@laquiniela247.mx</strong> / <strong>demo123</strong>
              </p>
            </div>

            {/* Back to Main Site */}
            <div className="mt-6 text-center">
              <Link 
                href="/"
                className="text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
              >
                ← {t('navigation.back_to_main')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}