import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useDemo } from '@/context/DemoContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  newsletter: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  totalBets: number | null;
  totalWinnings: number | null;
  overallPercentage: number | null;
  bestRankingPosition: number | null;
  memberSince: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { isDemoUser } = useDemo();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Set mock data for demo
      setProfile({
        firstName: user?.firstName || 'Demo',
        lastName: user?.lastName || 'User',
        email: user?.email || 'demo@laquiniela247.mx',
        phone: '+52 55 1234 5678',
        dateOfBirth: '1990-01-01',
        country: 'México',
        city: 'Ciudad de México',
        newsletter: true,
        emailNotifications: true,
        smsNotifications: false,
        totalBets: 24,
        totalWinnings: 2500,
        overallPercentage: 66.7,
        bestRankingPosition: 10,
        memberSince: '2023-01-15'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    setSaving(true);
    try {
      await axios.put('/api/users/profile', updatedData);
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      toast.success(t('profile.changes_saved'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('profile.update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = t('profile.current_password_required');
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = t('auth.password_required');
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = t('auth.password_min_length');
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('auth.passwords_dont_match');
    }
    
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setSaving(true);
    try {
      await axios.post('/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success(t('profile.password_changed'));
    } catch (error: any) {
      console.error('Failed to change password:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t('profile.password_change_failed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Layout title={t('profile.title')}>
        <ProtectedRoute>
          <div className="flex items-center justify-center min-h-96">
            <div className="spinner"></div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout title={t('profile.title')}>
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card text-center py-12">
              <h2 className="subsection-title">
                {t('profile.profile_not_found')}
              </h2>
            </div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout title={t('profile.title')}>
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="page-title">
              {t('profile.my_profile')}
            </h1>
            <h2 className="section-title">
              {t('profile.title')}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400">
              {t('profile.manage_account_settings')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'personal'
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t('profile.personal_info')}
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'security'
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t('profile.account_security')}
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t('profile.notifications')}
                </button>
                
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t('profile.performance_stats')}
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">{t('profile.personal_info')}</h2>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const updatedData = {
                      firstName: formData.get('firstName') as string,
                      lastName: formData.get('lastName') as string,
                      phone: formData.get('phone') as string,
                      dateOfBirth: formData.get('dateOfBirth') as string,
                      country: formData.get('country') as string,
                      city: formData.get('city') as string,
                    };
                    handleProfileUpdate(updatedData);
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">
                          {t('auth.first_name')}
                        </label>
                        <input
                          name="firstName"
                          type="text"
                          defaultValue={profile.firstName}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">
                          {t('auth.last_name')}
                        </label>
                        <input
                          name="lastName"
                          type="text"
                          defaultValue={profile.lastName}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">
                          {t('auth.email')}
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          className="form-input bg-secondary-50 dark:bg-secondary-700"
                          disabled
                        />
                        <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                          {t('profile.email_cannot_be_changed')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="form-label">
                          {t('profile.phone')}
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          defaultValue={profile.phone}
                          className="form-input"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">
                          {t('profile.date_of_birth')}
                        </label>
                        <input
                          name="dateOfBirth"
                          type="date"
                          defaultValue={profile.dateOfBirth}
                          className="form-input"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">
                          {t('profile.country')}
                        </label>
                        <input
                          name="country"
                          type="text"
                          defaultValue={profile.country}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="form-label">
                          {t('profile.city')}
                        </label>
                        <input
                          name="city"
                          type="text"
                          defaultValue={profile.city}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className={`btn-primary ${saving ? 'btn-disabled' : ''}`}
                      >
                        {saving ? t('common.saving') : t('profile.save_changes')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">{t('profile.change_password')}</h2>
                    </div>
                    
                    <form onSubmit={handlePasswordChange}>
                      <div className="space-y-4">
                        <div>
                          <label className="form-label">
                            {t('profile.current_password')}
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                            required
                          />
                          {passwordErrors.currentPassword && (
                            <p className="form-error">{passwordErrors.currentPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="form-label">
                            {t('profile.new_password')}
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                            required
                          />
                          {passwordErrors.newPassword && (
                            <p className="form-error">{passwordErrors.newPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="form-label">
                            {t('auth.confirm_password')}
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                            required
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="form-error">{passwordErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={saving}
                          className={`btn-primary ${saving ? 'btn-disabled' : ''}`}
                        >
                          {saving ? t('common.saving') : t('profile.change_password')}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">{t('profile.account_actions')}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-secondary-600 dark:text-secondary-400">
                        {t('profile.member_since')}: {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}
                      </p>
                      
                      <button
                        onClick={logout}
                        className="btn-outline text-error-600 border-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                      >
                        {t('profile.logout_all_devices')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">{t('profile.notification_preferences')}</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                                        <h3 className="content-title">
                  {t('profile.email_notifications')}
                </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('profile.email_notifications_desc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.emailNotifications}
                        onChange={(e) => handleProfileUpdate({ emailNotifications: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="content-title">
                          {t('profile.sms_notifications')}
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('profile.sms_notifications_desc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.smsNotifications}
                        onChange={(e) => handleProfileUpdate({ smsNotifications: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="content-title">
                          {t('auth.newsletter')}
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('profile.newsletter_desc')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.newsletter}
                        onChange={(e) => handleProfileUpdate({ newsletter: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">{t('profile.performance_stats')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="performance-card">
                        <div className="performance-card-title">
                          {t('dashboard.total_bets')}
                        </div>
                        <div className="performance-card-value">
                          {profile.totalBets || 0}
                        </div>
                      </div>
                      
                      <div className="performance-card">
                        <div className="performance-card-title">
                          {t('dashboard.total_winnings')}
                        </div>
                        <div className="performance-card-value">
                          {formatCurrency(profile.totalWinnings)}
                        </div>
                      </div>
                      
                      <div className="performance-card">
                        <div className="performance-card-title">
                          {t('dashboard.correct_percentage')}
                        </div>
                        <div className="performance-card-value">
                          {formatPercentage(profile.overallPercentage)}
                        </div>
                      </div>
                      
                      <div className="performance-card">
                        <div className="performance-card-title">
                          {t('dashboard.best_position')}
                        </div>
                        <div className="performance-card-value">
                          #{profile.bestRankingPosition || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">{t('profile.account_summary')}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {t('profile.member_since')}
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {t('profile.account_status')}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                          {t('profile.active')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>
      </ProtectedRoute>
    </Layout>
  );
}