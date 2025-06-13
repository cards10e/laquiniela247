import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import TeamLogo from '@/components/TeamLogo';
import axios from 'axios';

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
  status: 'scheduled' | 'live' | 'completed';
  homeScore?: number;
  awayScore?: number;
  userBet?: string;
}

interface RecentActivity {
  id: number;
  weekNumber: number;
  correctPredictions: number;
  totalPredictions: number;
  winnings: number;
  date: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, weekRes, gamesRes, statsRes] = await Promise.all([
        axios.get('/api/users/profile'),
        axios.get('/api/weeks/current'),
        axios.get('/api/games'),
        axios.get('/api/users/stats')
      ]);
      console.log('[Dashboard Debug] /api/users/profile response:', profileRes.data);
      console.log('[Dashboard Debug] /api/weeks/current response:', weekRes.data);
      console.log('[Dashboard Debug] /api/games response:', gamesRes.data);
      console.log('[Dashboard Debug] /api/users/stats response:', statsRes.data);
      // Debug: log raw games array
      console.log('[Dashboard Debug] Raw games array:', gamesRes.data.games);
      // Map backend games to frontend shape with defensive checks
      const mappedGames = (gamesRes.data.games || []).map((game: any) => {
        if (!game.homeTeam || !game.awayTeam) {
          console.warn('[Dashboard Debug] Skipping game with missing team:', game);
          return null;
        }
        return {
          id: game.id,
          homeTeamName: game.homeTeam?.name || '',
          awayTeamName: game.awayTeam?.name || '',
          homeTeamLogo: game.homeTeam?.logoUrl || '',
          awayTeamLogo: game.awayTeam?.logoUrl || '',
          gameDate: game.matchDate || '',
          status: (game.status || '').toLowerCase(),
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          userBet: game.userBet
        };
      }).filter(Boolean);
      console.log('[Dashboard Debug] Mapped games array:', mappedGames);
      // Debug: log raw recent activity array
      console.log('[Dashboard Debug] Raw recent activity:', statsRes.data.recentActivity?.recentBets);
      // Map recent activity with defensive checks (accept weekId or weekNumber, handle raw bet objects)
      const mappedRecentActivity = (statsRes.data.recentActivity?.recentBets || []).map((activity: any) => {
        // If this is a raw bet object, map to expected shape
        if (activity && activity.prediction && activity.game) {
          return {
            id: activity.id,
            weekNumber: activity.weekNumber ?? activity.weekId ?? activity.week?.weekNumber,
            correctPredictions: activity.isCorrect === true ? 1 : 0,
            totalPredictions: 1,
            winnings: activity.isCorrect === true ? 200 : 0,
            date: activity.date || activity.createdAt || '',
            homeTeamName: activity.game.homeTeam?.name,
            awayTeamName: activity.game.awayTeam?.name,
            prediction: activity.prediction,
            isCorrect: activity.isCorrect
          };
        }
        // Fallback to previous mapping
        if (!activity || (activity.weekNumber == null && activity.weekId == null)) {
          console.warn('[Dashboard Debug] Skipping invalid activity:', activity);
          return null;
        }
        return {
          id: activity.id,
          weekNumber: activity.weekNumber ?? activity.weekId,
          correctPredictions: Number(activity.correctPredictions) || 0,
          totalPredictions: Number(activity.totalPredictions) || 0,
          winnings: Number(activity.winnings) || 0,
          date: activity.date || activity.createdAt || ''
        };
      }).filter(Boolean);
      console.log('[Dashboard Debug] Mapped recent activity:', mappedRecentActivity);
      // Parse numeric fields as numbers for robustness
      setProfile({
        ...profileRes.data.user.profile,
        totalBets: Number(profileRes.data.user.profile.totalBets),
        overallPercentage: Number(profileRes.data.user.profile.overallPercentage),
        totalWinnings: Number(profileRes.data.user.profile.totalWinnings),
        bestRankingPosition: Number(profileRes.data.user.profile.bestRankingPosition),
        currentStreak: Number(profileRes.data.user.profile.currentStreak || 0),
        bestWeek: Number(profileRes.data.user.profile.bestWeek || 0)
      });
      setCurrentWeek({
        ...weekRes.data.week,
        status: (weekRes.data.week.status || '').toLowerCase()
      });
      setGames(mappedGames);
      setRecentActivity(mappedRecentActivity);
      // Log final recent activity state after mapping
      setTimeout(() => {
        console.log('[Final Recent Activity]', mappedRecentActivity);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Remove all mock data. Only set loading to false and optionally set error state.
      setProfile(null);
      setCurrentWeek(null);
      setGames([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
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

  // Render-time debug logs
  console.log('[Render] recentActivity:', recentActivity);
  console.log('[Render] games:', games);

  return (
    <Layout title={t('dashboard.title')}>
      <ProtectedRoute>
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
                <div className="performance-card-value">
                  {formatCurrency(profile?.totalWinnings || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Current Week */}
          {currentWeek && (
            <div className="mb-8">
              <h2 className="section-title">
                {t('dashboard.current_week')}
              </h2>
              
              <div className="bg-primary-600 text-white rounded-lg p-6 mb-6 shadow-lq247-accent">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h3 className="subsection-title">
                      {t('dashboard.week')} {currentWeek.weekNumber}
                    </h3>
                    {currentWeek.status === 'open' && (
                      <span className="inline-block bg-warning-600 text-secondary-900 px-3 py-1 rounded-full text-sm font-medium">
                        {t('dashboard.open_for_betting')}
                      </span>
                    )}
                  </div>
                  
                  {currentWeek.bettingDeadline && currentWeek.status === 'open' && (
                    <div className="bg-secondary-900 text-white px-4 py-2 rounded-lg">
                      <div className="text-sm opacity-90">{t('dashboard.betting_closes_in')}</div>
                      <div className="font-bold text-lg">
                        {timeUntilDeadline(currentWeek.bettingDeadline)}
                      </div>
                    </div>
                  )}
                </div>
                
                {currentWeek.status === 'open' && (
                  <Link
                    href="/bet"
                    className="inline-flex items-center px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-secondary-50 transition-colors"
                  >
                    {t('dashboard.place_bet')}
                  </Link>
                )}
              </div>

              {/* Games Preview */}
              {Array.isArray(games) && games.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.slice(0, 6).map((game) => {
                    console.log('[Render] game:', game);
                    return (
                      <div key={game.id} className="match-card">
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="flex items-center space-x-2">
                            <TeamLogo 
                              teamName={game.homeTeamName}
                              logoUrl={game.homeTeamLogo}
                              className="w-8 h-8 rounded-full object-cover"
                              alt={game.homeTeamName}
                            />
                            <span className="text-sm font-medium">{game.homeTeamName}</span>
                          </div>
                          <span className="text-xs text-secondary-500 dark:text-secondary-400">vs</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{game.awayTeamName}</span>
                            <TeamLogo 
                              teamName={game.awayTeamName}
                              logoUrl={game.awayTeamLogo}
                              className="w-8 h-8 rounded-full object-cover"
                              alt={game.awayTeamName}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">
                            {new Date(game.gameDate).toLocaleDateString()}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            game.status === 'completed'
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                              : game.status === 'live'
                              ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                              : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300'
                          }`}>
                            {game.status === 'completed' ? 'Completed' : 
                             game.status === 'live' ? 'Live' : 
                             'Scheduled'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Actions - COMMENTED OUT */}
          {/*
          <div className="mb-8">
            <h2 className="section-title">
              {t('dashboard.quick_actions')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/bet"
                className="card hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-primary-600 dark:text-primary-400 text-2xl mb-2">🎯</div>
                <h3 className="content-title">
                  {t('dashboard.new_bet')}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('dashboard.place_predictions')}
                </p>
              </Link>
              
              <Link
                href="/history"
                className="card hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-primary-600 dark:text-primary-400 text-2xl mb-2">📊</div>
                <h3 className="content-title">
                  {t('dashboard.view_history')}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('dashboard.check_past_bets')}
                </p>
              </Link>
              
              <Link
                href="/profile"
                className="card hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-primary-600 dark:text-primary-400 text-2xl mb-2">⚙️</div>
                <h3 className="content-title">
                  {t('dashboard.profile_settings')}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('dashboard.manage_account')}
                </p>
              </Link>
              
              <div className="card text-center">
                <div className="text-primary-600 dark:text-primary-400 text-2xl mb-2">🏆</div>
                <h3 className="content-title">
                  {t('dashboard.results')}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('dashboard.view_results')}
                </p>
              </div>
            </div>
          </div>
          */}

          {/* Recent Activity */}
          <div>
            <h2 className="section-title">
              {t('dashboard.recent_activity')}
            </h2>
            {/* Defensive check for recentActivity */}
            {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
              <div className="card">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    console.log('[Render] activity:', activity);
                    return (
                      <div key={activity.id} className="flex items-center justify-between py-3 border-b border-secondary-200 dark:border-secondary-700 last:border-b-0">
                        <div>
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                            {t('dashboard.week')} {activity.weekNumber}
                          </h4>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            {activity.correctPredictions}/{activity.totalPredictions} {t('dashboard.correct')}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-success-600 dark:text-success-400">
                            {formatCurrency(activity.winnings)}
                          </div>
                          <div className="text-sm text-secondary-600 dark:text-secondary-400">
                            {formatPercentage((activity.correctPredictions / activity.totalPredictions) * 100)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href="/history"
                    className="btn-outline"
                  >
                    {t('dashboard.view_all_history')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="text-secondary-400 dark:text-secondary-500 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  {t('dashboard.no_recent_activity')}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  {t('dashboard.start_betting_message')}
                </p>
                <Link
                  href="/bet"
                  className="btn-primary"
                >
                  {t('dashboard.place_first_bet')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </Layout>
  );
}