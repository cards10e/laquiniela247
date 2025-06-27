import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRestrictedRoute } from '@/components/auth/AdminRestrictedRoute';
import TeamLogo from '@/components/TeamLogo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
// 🧪 TESTING: Import the new hook for side-by-side testing
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
  
  // 🧪 TESTING: Use new hook in parallel with existing implementation
  const hookData = useDashboardData({ language, t });
  
  // 📊 CURRENT: Keep existing implementation for comparison
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCategory[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    initializeLeaderboardData();
  }, [language, t]);

  // 🧪 TESTING: Log comparison data for verification
  useEffect(() => {
    if (!loading && !hookData.loading) {
      console.log('[🧪 HOOK TEST] Current vs Hook comparison:');
      console.log('Profile match:', JSON.stringify(profile) === JSON.stringify(hookData.profile));
      console.log('Week match:', JSON.stringify(currentWeek) === JSON.stringify(hookData.currentWeek));
      console.log('Games count match:', games.length === hookData.games.length);
      console.log('Leaderboard count match:', leaderboardData.length === hookData.leaderboardData.length);
      
      if (games.length !== hookData.games.length) {
        console.log('[🧪 HOOK TEST] Games difference:');
        console.log('Current games:', games.length, games.map(g => g.id));
        console.log('Hook games:', hookData.games.length, hookData.games.map(g => g.id));
      }
    }
  }, [loading, hookData.loading, profile, hookData.profile, games, hookData.games]);

  const initializeLeaderboardData = () => {
    // Localized usernames based on language
    const usernames = {
      en: {
        weekly: ['TheChampion247', 'GoldenGoal', 'AceMexico', 'QuinielaKing'],
        performance: ['MasterPredictor', 'FootballSage', 'TheOracle', 'LigaMXPro'],
        consistent: ['SteadyWinner', 'TheConsistent', 'RockSolid247', 'QuinielaPro'],
        winners: ['TheMillionaire', 'CashMaster', 'GoldenTouch', 'MoneyMaker247'],
        streaks: ['NeverMiss', 'TheDedicated', 'WeeklyWarrior', 'ConstantPlayer']
      },
      es: {
        weekly: ['ElChampion247', 'GoldenGoal', 'AceMexico', 'LaQuinielaKing'],
        performance: ['MasterPredictor', 'FutbolSage', 'ElOraculo', 'LigaMXPro'],
        consistent: ['SteadyWinner', 'ElConsistente', 'RockSolid247', 'QuinielaPro'],
        winners: ['ElMillonario', 'CashMaster', 'GoldenTouch', 'MoneyMaker247'],
        streaks: ['NeverMiss', 'ElDedicado', 'WeeklyWarrior', 'ConstantPlayer']
      }
    };

    const currentUsernames = usernames[language] || usernames.es;

    // Mock leaderboard data matching the requested categories
    const mockData: LeaderboardCategory[] = [
      {
        title: t('dashboard.biggest_winners'),
        description: t('dashboard.biggest_winners_desc'),
        scoreFormat: 'currency',
        entries: [
          { id: 1, rank: 1, playerName: currentUsernames.winners[0], score: 24000 },
          { id: 2, rank: 2, playerName: currentUsernames.winners[1], score: 18000 },
          { id: 3, rank: 3, playerName: currentUsernames.winners[2], score: 16000 },
          { id: 4, rank: 4, playerName: currentUsernames.winners[3], score: 14000 },
          { id: 5, rank: 5, playerName: 'Demo User', score: 12000, isCurrentUser: true }
        ]
      },
      {
        title: t('dashboard.participation_streaks'),
        description: t('dashboard.participation_streaks_desc'),
        scoreFormat: 'weeks',
        entries: [
          { id: 1, rank: 1, playerName: currentUsernames.streaks[0], score: 15 },
          { id: 2, rank: 2, playerName: currentUsernames.streaks[1], score: 12 },
          { id: 3, rank: 3, playerName: currentUsernames.streaks[2], score: 10 },
          { id: 4, rank: 4, playerName: 'Demo User', score: 8, isCurrentUser: true },
          { id: 5, rank: 5, playerName: currentUsernames.streaks[3], score: 7 }
        ]
      },
      {
        title: t('dashboard.most_consistent'),
        description: t('dashboard.most_consistent_desc'),
        scoreFormat: 'percentage',
        entries: [
          { id: 1, rank: 1, playerName: currentUsernames.consistent[0], score: 88.7 },
          { id: 2, rank: 2, playerName: currentUsernames.consistent[1], score: 86.4 },
          { id: 3, rank: 3, playerName: currentUsernames.consistent[2], score: 84.2 },
          { id: 4, rank: 4, playerName: currentUsernames.consistent[3], score: 82.9 },
          { id: 5, rank: 5, playerName: 'Demo User', score: 81.6, isCurrentUser: true }
        ]
      },
      {
        title: t('dashboard.weekly_winners'),
        description: t('dashboard.weekly_winners_desc'),
        scoreFormat: 'perfect',
        entries: [
          { id: 1, rank: 1, playerName: currentUsernames.weekly[0], score: 100, weekNumber: 28 },
          { id: 2, rank: 2, playerName: currentUsernames.weekly[1], score: 100, weekNumber: 27 },
          { id: 3, rank: 3, playerName: currentUsernames.weekly[2], score: 100, weekNumber: 26 },
          { id: 4, rank: 4, playerName: currentUsernames.weekly[3], score: 100, weekNumber: 25 }
        ]
      },
      {
        title: t('dashboard.best_performance'),
        description: t('dashboard.best_performance_desc'),
        scoreFormat: 'percentage',
        entries: [
          { id: 1, rank: 1, playerName: currentUsernames.performance[0], score: 94.2 },
          { id: 2, rank: 2, playerName: currentUsernames.performance[1], score: 91.8 },
          { id: 3, rank: 3, playerName: currentUsernames.performance[2], score: 89.5 },
          { id: 4, rank: 4, playerName: currentUsernames.performance[3], score: 87.3 },
          { id: 5, rank: 5, playerName: 'Demo User', score: 85.1, isCurrentUser: true }
        ]
      }
    ];
    setLeaderboardData(mockData);
  };

  const fetchDashboardData = async () => {
    try {
      const [profileRes, weekRes, gamesRes, statsRes] = await Promise.all([
        axios.get('/api/users/profile'),
        axios.get('/api/weeks/current'),
        axios.get('/api/games?limit=100'),
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
      
      // Sort games to prioritize upcoming games for dashboard display
      const sortedGames = mappedGames.sort((a: Game, b: Game) => {
        const now = new Date();
        const dateA = new Date(a.gameDate);
        const dateB = new Date(b.gameDate);
        
        // Separate upcoming and past games
        const aIsUpcoming = dateA > now;
        const bIsUpcoming = dateB > now;
        
        // If one is upcoming and other isn't, prioritize upcoming
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        
        // If both are upcoming, sort by date (earliest first)
        if (aIsUpcoming && bIsUpcoming) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If both are past, sort by date (most recent first)
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('[Dashboard Debug] Sorted games array:', sortedGames.map((g: Game) => ({ 
        id: g.id, 
        date: g.gameDate, 
        status: g.status,
        teams: `${g.homeTeamName} vs ${g.awayTeamName}`
      })));
      
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
      setGames(sortedGames);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Remove all mock data. Only set loading to false and optionally set error state.
      setProfile(null);
      setCurrentWeek(null);
      setGames([]);
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