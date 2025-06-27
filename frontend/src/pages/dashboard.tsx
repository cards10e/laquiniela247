import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRestrictedRoute } from '@/components/auth/AdminRestrictedRoute';
import TeamLogo from '@/components/TeamLogo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';
import { useDashboardData } from '@/hooks/useDashboardData';

interface UserProfile {
  totalBets: number;
  overallPercentage: number;
  bestRankingPosition: number;
  totalWinnings: number;
  currentStreak: number;
  bestWeek: number;
}

interface Week {
  id: number;
  weekNumber: number;
  status: 'open' | 'closed' | 'completed';
  bettingDeadline: string;
  startDate: string;
  endDate: string;
}

interface Game {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  gameDate: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  userBet?: string;
}

interface LeaderboardEntry {
  id: number;
  rank: number;
  playerName: string;
  score: number | string;
  weekNumber?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardCategory {
  title: string;
  description: string;
  entries: LeaderboardEntry[];
  scoreFormat: 'percentage' | 'currency' | 'weeks' | 'perfect';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  
  // ✅ MIGRATED: Use optimized hook with memory leak prevention
  const { 
    profile, 
    currentWeek, 
    games, 
    leaderboardData, 
    loading, 
    error 
  } = useDashboardData({ language, t });



  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatScore = (score: number | string, format: string) => {
    switch (format) {
      case 'percentage':
        return `${Number(score).toFixed(1)}%`;
      case 'currency':
        return formatCurrency(Number(score));
      case 'weeks':
        return `${score} ${t('dashboard.weeks')}`;
      case 'perfect':
        return t('dashboard.perfect_score');
      default:
        return String(score);
    }
  };

  const timeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return t('dashboard.betting_closed');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Layout title={t('dashboard.title')}>
        <ProtectedRoute>
          <div className="flex items-center justify-center min-h-96">
            <div className="spinner"></div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={t('dashboard.title')}>
        <ProtectedRoute>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <p className="text-error-600 dark:text-error-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout title={t('dashboard.title')}>
      <ProtectedRoute>
        <AdminRestrictedRoute>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="page-title">
              {t('dashboard.welcome').replace('%s', user?.firstName || user?.displayName || '')}
            </h1>
          </div>

          {/* Performance Overview */}
          <div className="mb-8">
            <h2 className="section-title">
              {t('dashboard.performance_overview')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('dashboard.total_bets')}
                </div>
                <div className="performance-card-value">
                  {profile?.totalBets || 0}
                </div>
              </div>
              
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('dashboard.correct_percentage')}
                </div>
                <div className="performance-card-value">
                  {formatPercentage(profile?.overallPercentage || 0)}
                </div>
              </div>
              
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('dashboard.ranking_percentile')}
                </div>
                <div className="performance-card-value">
                  {profile?.bestRankingPosition 
                    ? `Top ${Math.min(100, Math.max(1, Math.round((profile.bestRankingPosition / 1000) * 100)))}%`
                    : 'Top 1%'
                  }
                </div>
              </div>
              
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('dashboard.total_winnings')}
                </div>
                <div className={`performance-card-value ${
                  (profile?.totalWinnings || 0) > 0 
                    ? '!text-success-600 dark:!text-success-400'
                    : '!text-error-600 dark:!text-error-400'
                }`}>
                  {formatCurrency(profile?.totalWinnings || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* La Quiniela 247 Leaderboard */}
          <div>
            <h2 className="section-title mb-6">
              {t('dashboard.leaderboard_title')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {leaderboardData.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white dark:bg-secondary-800 rounded-lg shadow-lq247-accent overflow-hidden border border-primary-100 dark:border-primary-800">
                  {/* Category Header */}
                  <div className="bg-primary-600 text-white px-4 sm:px-6 py-3 sm:py-4">
                    <h3 className="text-base sm:text-lg font-medium mb-1">{category.title}</h3>
                    <p className="text-primary-100 text-xs sm:text-sm opacity-90">{category.description}</p>
                  </div>

                  {/* Leaderboard Entries */}
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {category.entries.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
                            entry.isCurrentUser
                              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                              : 'bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
                              entry.rank === 1
                                ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-100 shadow-xl border-2 border-yellow-300'
                                : entry.rank === 2
                                ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 text-gray-100 shadow-xl border-2 border-gray-200'
                                : entry.rank === 3
                                ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-amber-100 shadow-xl border-2 border-amber-300'
                                : entry.isCurrentUser
                                ? 'bg-primary-500 text-white'
                                : 'bg-secondary-300 dark:bg-secondary-600 text-secondary-700 dark:text-secondary-300'
                            }`}>
                              {entry.rank <= 3 ? (
                                <FontAwesomeIcon 
                                  icon={entry.rank === 1 ? faCrown : entry.rank === 2 ? faMedal : faAward}
                                  className={`${
                                    entry.rank === 1 
                                      ? 'text-yellow-200 text-lg sm:text-xl' 
                                      : entry.rank === 2 
                                      ? 'text-gray-200 text-base sm:text-lg' 
                                      : 'text-amber-200 text-base sm:text-lg'
                                  } drop-shadow-lg`}
                                />
                              ) : (
                                entry.rank
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium text-sm sm:text-base truncate ${
                                entry.isCurrentUser 
                                  ? 'text-primary-700 dark:text-primary-300' 
                                  : 'text-secondary-900 dark:text-secondary-100'
                              }`}>
                                {entry.playerName}
                                {entry.isCurrentUser && (
                                  <span className="ml-1 sm:ml-2 text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-1 sm:px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </p>
                              {entry.weekNumber && (
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                  {t('dashboard.week')} {entry.weekNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className={`font-medium text-sm sm:text-base ${
                              entry.isCurrentUser
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-secondary-900 dark:text-secondary-100'
                            }`}>
                              {formatScore(entry.score, category.scoreFormat)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>


                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </AdminRestrictedRoute>
      </ProtectedRoute>
    </Layout>
  );
}