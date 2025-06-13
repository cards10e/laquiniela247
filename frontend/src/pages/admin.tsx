import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { addDays, startOfWeek, format, isAfter, isBefore } from 'date-fns';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import TeamLogo from '@/components/TeamLogo';
import React from 'react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  totalBets: number;
  totalWinnings: number;
}

interface Week {
  id: number;
  weekNumber: number;
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  bettingDeadline: string;
  startDate: string;
  endDate: string;
}

interface Game {
  id: number;
  weekId: number;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: string;
  status: 'scheduled' | 'live' | 'completed';
  homeScore?: number;
  awayScore?: number;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  bettingStatus?: {
    status: 'open' | 'ready' | 'scheduled' | 'past' | 'closed';
    autoOpenDate: string | null;
    canOpenNow: boolean;
    description: string;
  };
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  totalRevenue: number;
  currentWeekBets: number;
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [currentWeek, setCurrentWeek] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Form states
  const [newWeek, setNewWeek] = useState({
    weekNumber: '',
    season: '2025',
    bettingDeadline: '',
    startDate: '',
    endDate: ''
  });
  const [newGame, setNewGame] = useState({
    weekId: '',
    homeTeamId: '',
    awayTeamId: '',
    gameDate: ''
  });

  // Add state for hour and minute selection
  const [gameDate, setGameDate] = useState('');
  const [gameHour, setGameHour] = useState('12');
  const [gameMinute, setGameMinute] = useState('00');

  // Add state for the deadline modal
  const [showDeadlineModal, setShowDeadlineModal] = useState<string | null>(null);

  // Add state for selected deadline (in hours)
  const [selectedDeadlineHours, setSelectedDeadlineHours] = useState<string | null>(null);

  // Add at the top level of the AdminPage component, before the return statement:
  const [openDeadlineWeekId, setOpenDeadlineWeekId] = React.useState<number | null>(null);
  const [deadlineLoading, setDeadlineLoading] = React.useState(false);

  // NEW: State for expandable game cards (mobile-first UX)
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  const [axiosInstance] = useState(() => {
    return axios.create({
      baseURL: '/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  });

  useEffect(() => {
    fetchAdminData();
    fetchTeams();
  }, []);

  // Removed automatic refresh - users can manually refresh if needed
  // The constant 30-second refresh was causing UX issues on mobile

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, weeksRes, gamesRes] = await Promise.all([
        axiosInstance.get('/admin/dashboard'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/weeks'),
        axiosInstance.get('/admin/games')
      ]);

      setStats(statsRes.data.overview || statsRes.data);
      setCurrentWeek(statsRes.data.currentWeek || null);
      setUsers(usersRes.data.users || []);
      setWeeks(Array.isArray(weeksRes.data) ? weeksRes.data : weeksRes.data.weeks);
      
      // Normalize games data with betting status
      const normalizeGame = (game: any) => ({
        id: game.id,
        weekId: game.weekId || game.weekNumber || (game.week && (game.week.id || game.week.weekNumber)),
        homeTeamName: game.homeTeamName || game.homeTeam?.name || 'TBD',
        awayTeamName: game.awayTeamName || game.awayTeam?.name || 'TBD',
        gameDate: game.gameDate || game.matchDate || '',
        status: (game.status || 'SCHEDULED').toLowerCase(), // Ensure lowercase for consistency
        homeTeamLogo: game.homeTeam?.logoUrl || '',
        awayTeamLogo: game.awayTeam?.logoUrl || '',
        bettingStatus: game.bettingStatus, // Include computed betting status from backend
      });

      const normalizedGames = (gamesRes.data.games || []).map(normalizeGame);
      console.log('[Admin Panel Debug] Fetched games:', normalizedGames.map((g: Game) => ({ id: g.id, status: g.status, weekId: g.weekId, gameDate: g.gameDate })));
      setGames(normalizedGames);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error(t('admin.fetch_error'));
      // Set empty states instead of mock data
      setStats(null);
      setUsers([]);
      setWeeks([]);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-opener utility function
  const handleAutoOpenWeeks = async () => {
    try {
      const response = await axiosInstance.post('/admin/weeks/auto-open');
      if (response.data.openedWeeks.length > 0) {
        toast.success(t('admin.auto_open_success', { count: response.data.openedWeeks.length }));
        fetchAdminData(); // Refresh data
      } else {
        toast.success(t('admin.no_weeks_ready_auto_open'));
      }
    } catch (error) {
      console.error('Failed to auto-open weeks:', error);
      toast.error('Failed to auto-open weeks');
    }
  };

  // Auto-update game statuses utility function
  const handleAutoUpdateGameStatuses = async () => {
    try {
      const response = await axiosInstance.post('/admin/games/auto-update-status');
      if (response.data.updates.length > 0) {
        toast.success(t('admin.auto_open_success', { count: response.data.updates.length }).replace('weeks', 'game statuses'));
        fetchAdminData(); // Refresh data
      } else {
        toast.success(t('admin.all_statuses_updated'));
      }
    } catch (error) {
      console.error('Failed to auto-update game statuses:', error);
      toast.error('Failed to auto-update game statuses');
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axiosInstance.get('/admin/teams');
      setTeams(res.data.teams || []);
    } catch (error) {
      setTeams([]);
    }
  };

  const handleCreateWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('[DEBUG] Sending week creation request:', newWeek);
      const res = await axiosInstance.post('/admin/weeks', {
        weekNumber: parseInt(newWeek.weekNumber),
        season: newWeek.season,
        bettingDeadline: newWeek.bettingDeadline,
        startDate: newWeek.startDate,
        endDate: newWeek.endDate
      });
      console.log('[DEBUG] Week creation response:', res.data);
      toast.success(t('admin.week_created'));
      setNewWeek({ weekNumber: '', season: '2025', bettingDeadline: '', startDate: '', endDate: '' });
      fetchAdminData();
    } catch (error) {
      console.error('[DEBUG] Failed to create week:', error);
      toast.error(t('admin.week_creation_failed'));
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find the selected week in allWeeks
      const selectedWeek = allWeeks.find(w => w.id === newGame.weekId);
      if (!selectedWeek) throw new Error('Selected week not found');
      // Check if week exists in backend
      let backendWeek = weeks.find(w => w.weekNumber === selectedWeek.weekNumber);
      let backendWeekId;
      if (!backendWeek) {
        // Create the week and use the returned ID, set betting deadline here
        const firstGameDate = newGame.gameDate ? new Date(newGame.gameDate) : new Date(selectedWeek.startDate);
        const bettingDeadline = new Date(firstGameDate.getTime() - Number(selectedDeadlineHours) * 60 * 60 * 1000).toISOString();
        const weekRes = await axiosInstance.post('/admin/weeks', {
          weekNumber: selectedWeek.weekNumber,
          season: '2025',
          startDate: selectedWeek.startDate,
          endDate: selectedWeek.endDate,
          bettingDeadline
        });
        backendWeekId = weekRes.data.id;
      } else {
        backendWeekId = backendWeek.id;
        // Do NOT update the week, since no update endpoint exists
      }
      if (!backendWeekId) throw new Error('Failed to create or find week');
      // Create the game
      const matchDateISO = new Date(newGame.gameDate).toISOString();
      await axiosInstance.post('/admin/games', {
        weekNumber: selectedWeek.weekNumber,
        season: '2025',
        homeTeamId: parseInt(newGame.homeTeamId),
        awayTeamId: parseInt(newGame.awayTeamId),
        matchDate: matchDateISO
      });
      toast.success(t('admin.game_created'));
      setNewGame({ weekId: '', homeTeamId: '', awayTeamId: '', gameDate: '' });
      setSelectedDeadlineHours(null);
      setShowDeadlineModal(null);
      fetchAdminData();
    } catch (error: any) {
      toast.error(t('admin.game_creation_failed') + (error?.response?.data?.message ? ': ' + error.response.data.message : ''));
    }
  };

  const handleUpdateGameResult = async (gameId: number, homeScore: number, awayScore: number) => {
    try {
      await axiosInstance.put(`/admin/games/${gameId}/result`, {
        homeScore,
        awayScore,
        status: 'completed'
      });
      
      toast.success(t('admin.game_result_updated'));
      fetchAdminData();
    } catch (error) {
      console.error('Failed to update game result:', error);
      toast.error(t('admin.game_result_update_failed'));
    }
  };



  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}`, { isActive: !isActive });
      toast.success(t('admin.user_status_updated'));
      fetchAdminData();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(t('admin.user_status_update_failed'));
    }
  };

  const formatCurrency = (value: number, lang: string) => {
    if (!value || isNaN(value)) return lang === 'es' ? '$0' : '$0';
    
    if (lang === 'es') {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  // NEW: Helper functions for mobile-first game cards
  const toggleGameExpansion = (gameId: number) => {
    const newExpanded = new Set(expandedGames);
    if (newExpanded.has(gameId)) {
      newExpanded.delete(gameId);
    } else {
      newExpanded.add(gameId);
    }
    setExpandedGames(newExpanded);
  };

  const getGamePrimaryStatus = (game: Game) => {
    // Determine the single most important status to show
    // PRIORITY 1: Match status (live/completed) - most important for ongoing games
    if (game.status === 'completed') {
      return { text: t('admin.match_completed'), emoji: '✅', color: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' };
    }
    if (game.status === 'live') {
      return { text: t('admin.match_live'), emoji: '🔴', color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400' };
    }
    
    // PRIORITY 2: Betting status (only for scheduled games)
    if (game.bettingStatus?.status === 'open') {
      return { text: t('admin.betting_available'), emoji: '🎯', color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400' };
    }
    if (game.bettingStatus?.status === 'ready') {
      return { text: t('admin.status_ready_short'), emoji: '🟡', color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400' };
    }
    
    // PRIORITY 3: Default scheduled status
    return { text: t('admin.match_scheduled'), emoji: '⚪', color: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300' };
  };

  // Generate weeks for the next two months
  const today = new Date();
  const weeksSet = new Set<number>();
  const generatedWeeks: { id: string; weekNumber: number; startDate: string; endDate: string }[] = [];
  for (let i = 0; i < 9; i++) { // 9 weeks covers ~2 months
    const weekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), i * 7);
    const weekEnd = addDays(weekStart, 6);
    const weekNumber = Number(format(weekStart, 'w'));
    generatedWeeks.push({
      id: `gen-${weekNumber}`,
      weekNumber,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString()
    });
    weeksSet.add(weekNumber);
  }
  // Merge backend weeks (avoid duplicates)
  const allWeeks = [
    ...generatedWeeks,
    ...weeks.filter(w => !weeksSet.has(w.weekNumber)).map(w => ({
      id: String(w.id),
      weekNumber: w.weekNumber,
      startDate: w.startDate,
      endDate: w.endDate
    }))
  ];
  allWeeks.sort((a, b) => a.weekNumber - b.weekNumber);

  // Only show weeks whose endDate is today or in the future
  const now = new Date();
  const validWeeks = allWeeks.filter(week => new Date(week.endDate) >= now);

  // Find the selected week object for date range restriction
  const selectedWeekObj = validWeeks.find(w => w.id === newGame.weekId);
  const minGameDate = selectedWeekObj ? selectedWeekObj.startDate.slice(0, 16) : undefined;
  const maxGameDate = selectedWeekObj ? selectedWeekObj.endDate.slice(0, 16) : undefined;

  // Delete game handler
  const handleDeleteGame = async (gameId: number) => {
    if (!window.confirm(t('admin.delete_game_confirm'))) return;
    try {
      await axiosInstance.delete(`/admin/games/${gameId}`);
      toast.success(t('admin.game_deleted'));
      fetchAdminData();
    } catch (error) {
      toast.error(t('admin.game_delete_failed'));
    }
  };

  // Add this helper function at the top or bottom of the file
  function combineDateTime(date: string, hour: string, minute: string) {
    if (!date) return '';
    return `${date}T${hour}:${minute}`;
  }

  // Handler to set current week and deadline
  async function handleSetCurrentWeek(weekId: string, hours: number) {
    // Find all games for this week
    const weekGames = games.filter(g => String(g.weekId) === String(weekId));
    if (!weekGames.length) {
      toast.error(t('admin.no_games_for_week'));
      return;
    }
    // Find the earliest gameDate
    const firstGame = weekGames.reduce((earliest, game) =>
      !earliest || new Date(game.gameDate) < new Date(earliest.gameDate) ? game : earliest, null as Game | null
    );
    const deadline = new Date(new Date(firstGame!.gameDate).getTime() - hours * 60 * 60 * 1000).toISOString();
    await axiosInstance.put(`/admin/weeks/${weekId}`, {
      status: 'open',
      bettingDeadline: deadline
    });
    setShowDeadlineModal(null);
    toast.success(t('admin.week_set_current'));
    fetchAdminData();
  }

  if (loading) {
    return (
      <Layout title={t('navigation.admin_panel')}>
        <ProtectedRoute requireAdmin>
          <div className="flex items-center justify-center min-h-96">
            <div className="spinner"></div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout title={t('navigation.admin_panel')}>
      <ProtectedRoute requireAdmin>
        <ErrorBoundary>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="page-title">
                {t('navigation.admin_panel')}
              </h1>
            </div>

            {/* Section Titles for Active Tabs */}
            {activeTab === 'overview' && (
              <div className="mb-8">
                <h2 className="section-title">
                  {t('dashboard.performance_overview')}
                </h2>
              </div>
            )}
            
            {activeTab === 'users' && (
              <div className="mb-8">
                <h2 className="section-title">
                  {t('admin.user_management')}
                </h2>
              </div>
            )}
            
            {activeTab === 'games' && (
              <div className="mb-8">
                <h2 className="section-title">
                  {t('admin.game_management')}
                </h2>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-secondary-200 dark:border-secondary-700">
                {['overview', 'users', 'games'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-primary-600 text-primary-600 font-bold'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
                    }`}
                  >
                    {tab === 'overview' ? t('dashboard.performance_overview') : tab === 'games' ? t('admin.game_management') : tab === 'users' ? t('admin.user_management_tab') : t(`admin.${tab}`)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="performance-card">
                    <div className="performance-card-title text-primary-600 font-semibold">
                      {t('admin.total_users')}
                    </div>
                    <div className="performance-card-value">
                      {stats.totalUsers.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="performance-card">
                    <div className="performance-card-title text-primary-600 font-semibold">
                      {t('admin.active_users')}
                    </div>
                    <div className="performance-card-value">
                      {stats.activeUsers.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="performance-card">
                    <div className="performance-card-title text-primary-600 font-semibold">
                      {t('admin.total_bets')}
                    </div>
                    <div className="performance-card-value">
                      {stats.totalBets.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="performance-card">
                    <div className="performance-card-title text-primary-600 font-semibold">
                      {t('admin.total_revenue')}
                    </div>
                    <div>
                      <span className="performance-card-value !text-success-600 dark:!text-success-400">
                        {formatCurrency(typeof stats.totalRevenue === 'number' && !isNaN(stats.totalRevenue) ? stats.totalRevenue : 125000, language)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-12 mb-4">
                  <h2 className="section-title">
                    {t('admin.recent_activity')}
                  </h2>
                </div>
                <div className="card">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600 dark:text-secondary-400">
                        {t('admin.current_week_bets')}
                      </span>
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                        {currentWeek?._count?.bets || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-600 dark:text-secondary-400">
                        {t('admin.user_activity_rate')}
                      </span>
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                        {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">{t('admin.user_management')}</h2>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="spinner"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center p-8 text-secondary-600 dark:text-secondary-400">
                    {t('admin.no_users_found')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                      <thead className="bg-secondary-50 dark:bg-secondary-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            {t('admin.user')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            {t('admin.role')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            {t('admin.total_bets')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            {t('admin.total_winnings')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            {t('admin.status')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            {t('admin.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-secondary-500 dark:text-secondary-400">
                                  {user.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role && user.role.toLowerCase() === 'admin'
                                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
                                  : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                              {user.totalBets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                              {formatCurrency(
                                typeof user.totalWinnings === 'number' && !isNaN(user.totalWinnings) ? user.totalWinnings : 0,
                                language
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isActive
                                  ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                                  : 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'
                              }`}>
                                {user.isActive ? t('admin.active') : t('admin.inactive')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                className={`${
                                  user.isActive
                                    ? 'text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300'
                                    : 'text-success-600 hover:text-success-900 dark:text-success-400 dark:hover:text-success-300'
                                }`}
                              >
                                {user.isActive ? t('admin.deactivate') : t('admin.activate')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Weeks Tab */}
            {/*
            {activeTab === 'weeks' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">{t('admin.existing_weeks')}</h2>
                </div>
                <div className="space-y-4">
                  {weeks.map((week) => (
                    <div key={week.id} className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                          {t('dashboard.week')} {week.weekNumber}
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        week.status === 'open'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                          : week.status === 'closed'
                          ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                          : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300'
                      }`}>
                        {t(`admin.${week.status}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            */}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div className="space-y-8">
                {/* Auto-Management Controls - Enhanced with Mobile-First UX */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Betting Window Control */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title text-base lg:text-lg">{t('admin.betting_window_control')}</h2>
                    </div>
                    <div className="flex flex-col gap-3 lg:gap-4">
                      {/* Status Indicator */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          {(() => {
                            const readyWeeks = weeks.filter(week => {
                              const readyGames = games.filter(game => 
                                game.weekId === week.weekNumber && 
                                game.bettingStatus?.status === 'ready'
                              );
                              return readyGames.length > 0;
                            });
                            const openWeeks = weeks.filter(week => week.status?.toLowerCase() === 'open');
                            
                            if (readyWeeks.length > 0) {
                              return (
                                <>
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
                                    📊 {t('admin.weeks_need_attention', { count: readyWeeks.length })}
                                  </span>
                                  <span className="text-xs text-secondary-600 dark:text-secondary-400">
                                    {openWeeks.length > 0 && `• ${t('admin.weeks_open', { count: openWeeks.length })}`}
                                  </span>
                                </>
                              );
                            } else if (openWeeks.length > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                                  ✅ {t('admin.weeks_open', { count: openWeeks.length })}
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
                                  💤 {t('admin.all_current')}
                                </span>
                              );
                            }
                          })()}
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('admin.betting_window_description')}
                        </p>
                      </div>
                      
                      {/* Action Button */}
                      {(() => {
                        const readyWeeks = weeks.filter(week => {
                          const readyGames = games.filter(game => 
                            game.weekId === week.weekNumber && 
                            game.bettingStatus?.status === 'ready'
                          );
                          return readyGames.length > 0;
                        });
                        
                        if (readyWeeks.length > 0) {
                          return (
                            <button
                              onClick={handleAutoOpenWeeks}
                              className="btn-warning w-full lg:w-auto min-h-[44px]"
                            >
                              🎯 {t('admin.open_betting_windows', { count: readyWeeks.length })}
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={handleAutoOpenWeeks}
                              className="btn-secondary w-full lg:w-auto min-h-[44px]"
                              disabled
                            >
                              ✅ {t('admin.all_current')}
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Game Status Sync */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title text-base lg:text-lg">{t('admin.game_status_sync')}</h2>
                    </div>
                    <div className="flex flex-col gap-3 lg:gap-4">
                      {/* Status Indicator */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          {(() => {
                            // Calculate games that might need status updates based on current time
                            const now = new Date();
                            const gamesNeedingUpdate = games.filter(game => {
                              const gameTime = new Date(game.gameDate);
                              const gameEndTime = new Date(gameTime.getTime() + 2.5 * 60 * 60 * 1000);
                              
                              if (game.status === 'scheduled' && now >= gameTime) return true;
                              if (game.status === 'live' && now >= gameEndTime) return true;
                              return false;
                            });
                            
                            if (gamesNeedingUpdate.length > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
                                  🔄 {t('admin.games_need_updates', { count: gamesNeedingUpdate.length })}
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                                  ✅ {t('admin.all_statuses_updated')}
                                </span>
                              );
                            }
                          })()}
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('admin.game_status_sync_description')}
                        </p>
                      </div>
                      
                      {/* Action Button */}
                      {(() => {
                        const now = new Date();
                        const gamesNeedingUpdate = games.filter(game => {
                          const gameTime = new Date(game.gameDate);
                          const gameEndTime = new Date(gameTime.getTime() + 2.5 * 60 * 60 * 1000);
                          
                          if (game.status === 'scheduled' && now >= gameTime) return true;
                          if (game.status === 'live' && now >= gameEndTime) return true;
                          return false;
                        });
                        
                        if (gamesNeedingUpdate.length > 0) {
                          return (
                            <button
                              onClick={handleAutoUpdateGameStatuses}
                              className="btn-warning w-full lg:w-auto min-h-[44px]"
                            >
                              🔄 {t('admin.sync_game_statuses')}
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={handleAutoUpdateGameStatuses}
                              className="btn-secondary w-full lg:w-auto min-h-[44px]"
                              disabled
                            >
                              ✅ {t('admin.all_current')}
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Create Game Form */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">{t('admin.create_game')}</h2>
                  </div>
                  <form onSubmit={handleCreateGame} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">
                          {t('admin.week')}
                        </label>
                        <select
                          value={newGame.weekId}
                          onChange={(e) => setNewGame(prev => ({ ...prev, weekId: e.target.value, gameDate: '' }))}
                          className="form-input"
                          required
                        >
                          <option value="">{t('admin.select_week')}</option>
                          {validWeeks.map((week) => (
                            <option key={week.id} value={week.id}>
                              {t('dashboard.week')} {week.weekNumber} ({format(new Date(week.startDate), 'MMM d')} - {format(new Date(week.endDate), 'MMM d')})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">
                          {t('admin.game_date')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={gameDate}
                            onChange={e => {
                              setGameDate(e.target.value);
                              setNewGame(prev => ({ ...prev, gameDate: combineDateTime(e.target.value, gameHour, gameMinute) }));
                            }}
                            className="form-input"
                            required
                            min={minGameDate ? minGameDate.split('T')[0] : undefined}
                            max={maxGameDate ? maxGameDate.split('T')[0] : undefined}
                          />
                          <select
                            value={gameHour}
                            onChange={e => {
                              setGameHour(e.target.value);
                              setNewGame(prev => ({ ...prev, gameDate: combineDateTime(gameDate, e.target.value, gameMinute) }));
                            }}
                            className="form-input"
                          >
                            {Array.from({length: 24}, (_, h) => h).map(h => (
                              <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                          <select
                            value={gameMinute}
                            onChange={e => {
                              setGameMinute(e.target.value);
                              setNewGame(prev => ({ ...prev, gameDate: combineDateTime(gameDate, gameHour, e.target.value) }));
                            }}
                            className="form-input"
                          >
                            {['00', '15', '30', '45'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label">
                          {t('admin.home_team')}
                        </label>
                        <select
                          value={newGame.homeTeamId}
                          onChange={(e) => setNewGame(prev => ({ ...prev, homeTeamId: e.target.value }))}
                          className="form-input"
                          required
                        >
                          <option value="">{t('admin.select_team')}</option>
                          {teams.filter(team => team.id.toString() !== newGame.awayTeamId).map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">
                          {t('admin.away_team')}
                        </label>
                        <select
                          value={newGame.awayTeamId}
                          onChange={(e) => setNewGame(prev => ({ ...prev, awayTeamId: e.target.value }))}
                          className="form-input"
                          required
                        >
                          <option value="">{t('admin.select_team')}</option>
                          {teams.filter(team => team.id.toString() !== newGame.homeTeamId).map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary">{t('admin.create_game')}</button>
                  </form>
                </div>

                {/* Quick Status Summary - NEW: Mobile-friendly overview */}
                <div className="card lg:hidden">
                  <div className="card-header">
                    <h3 className="card-title text-base">{t('admin.status_summary')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {(() => {
                      const openWeeks = weeks.filter(week => week.status?.toLowerCase() === 'open').length;
                      const readyWeeks = weeks.filter(week => {
                        const readyGames = games.filter(game => 
                          game.weekId === week.weekNumber && 
                          game.bettingStatus?.status === 'ready'
                        );
                        return readyGames.length > 0;
                      }).length;
                      const scheduledGames = games.filter(game => game.status === 'scheduled').length;
                      
                      return (
                        <>
                          {openWeeks > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                              🟢 {t('admin.weeks_open', { count: openWeeks })}
                            </span>
                          )}
                          {readyWeeks > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
                              🟡 {t('admin.weeks_need_attention', { count: readyWeeks })}
                            </span>
                          )}
                          {scheduledGames > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
                              ⚪ {t('admin.games_scheduled', { count: scheduledGames })}
                            </span>
                          )}
                          {openWeeks === 0 && readyWeeks === 0 && scheduledGames === 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
                              💤 {t('admin.all_current')}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Games List */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">{t('admin.existing_games')}</h2>
                    {/* Status Legend */}
                    <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">{t('admin.status_legend')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-2 rounded bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                          <span className="font-medium text-success-800 dark:text-success-400">{t('admin.week_status')}:</span>
                          <p className="text-success-600 dark:text-success-300 mt-1">{t('admin.week_status_desc')}</p>
                        </div>
                        <div className="p-2 rounded bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                          <span className="font-medium text-primary-800 dark:text-primary-400">{t('admin.betting_status')}:</span>
                          <p className="text-primary-600 dark:text-primary-300 mt-1">{t('admin.betting_status_desc')}</p>
                        </div>
                        <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <span className="font-medium text-blue-800 dark:text-blue-400">{t('admin.auto_status')}:</span>
                          <p className="text-blue-600 dark:text-blue-300 mt-1">{t('admin.auto_status_desc')}</p>
                        </div>
                        <div className="p-2 rounded bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600">
                          <span className="font-medium text-secondary-800 dark:text-secondary-300">{t('admin.match_status')}:</span>
                          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('admin.match_status_desc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {games.length === 0 ? (
                      <div className="text-center py-8 text-secondary-600 dark:text-secondary-400">
                        {t('admin.no_games_message')}
                      </div>
                    ) : (
                      // Group games by week
                      Object.entries(
                        games.reduce((acc, game) => {
                          const weekId = game.weekId;
                          if (!acc[weekId]) {
                            acc[weekId] = [];
                          }
                          acc[weekId].push(game);
                          return acc;
                        }, {} as Record<number, Game[]>)
                      ).map(([weekId, weekGames]) => {
                        const week = weeks.find(w => w.weekNumber === weekGames[0].weekId);

                        // Handler for opening betting
                        const handleOpenBetting = async (hours: string) => {
                          if (!week) return;
                          setDeadlineLoading(true);
                          try {
                            // Find earliest game date in this week
                            const firstGame = weekGames.reduce((earliest, game) =>
                              !earliest || new Date(game.gameDate) < new Date(earliest.gameDate) ? game : earliest, null as Game | null
                            );
                            const deadline = new Date(new Date(firstGame!.gameDate).getTime() - Number(hours) * 60 * 60 * 1000).toISOString();
                            await axiosInstance.put(`/admin/weeks/${week.id}`, {
                              status: 'open',
                              bettingDeadline: deadline
                            });
                            toast.success(t('admin.week_set_current'));
                            setOpenDeadlineWeekId(null);
                            fetchAdminData();
                          } catch (error) {
                            toast.error(t('admin.week_creation_failed'));
                          } finally {
                            setDeadlineLoading(false);
                          }
                        };

                        console.log('[DEBUG] weekId:', weekId, '\n[DEBUG] weekGames:', weekGames, '\n[DEBUG] found week:', week, '\n[DEBUG] week.status:', week && week.status);

                        return (
                          <div key={weekId} className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <h3 className="content-title">
                                  {t('dashboard.week')} {weekGames[0].weekId}
                                </h3>
                                {/* Mobile-friendly status indicators */}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {(() => {
                                    const readyGames = weekGames.filter(game => game.bettingStatus?.status === 'ready');
                                    const scheduledGames = weekGames.filter(game => game.bettingStatus?.status === 'scheduled');
                                    const openGames = weekGames.filter(game => game.bettingStatus?.status === 'open');
                                    const closedGames = weekGames.filter(game => game.bettingStatus?.status === 'closed');
                                    
                                    if (openGames.length > 0) {
                                      return (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                                          {t('admin.status_open_short')}
                                        </span>
                                      );
                                                                         } else if (closedGames.length > 0) {
                                       return (
                                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400">
                                           {t('admin.status_closed_short')}
                                         </span>
                                       );
                                    } else if (readyGames.length > 0) {
                                      return (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
                                          {t('admin.ready_count', { count: readyGames.length })}
                                        </span>
                                      );
                                    } else if (scheduledGames.length > 0 && scheduledGames[0].bettingStatus?.autoOpenDate) {
                                      const autoDate = new Date(scheduledGames[0].bettingStatus.autoOpenDate);
                                      return (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                          {t('admin.auto_date_format', { date: autoDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) })}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                              {/* Enhanced Week Controls */}
                              <div className="flex items-center gap-2">
                                {/* Auto-Open Button for Ready Games */}
                                {(() => {
                                  const readyGames = weekGames.filter(game => game.bettingStatus?.status === 'ready');
                                  const openGames = weekGames.filter(game => game.bettingStatus?.status === 'open');
                                  const closedGames = weekGames.filter(game => game.bettingStatus?.status === 'closed');
                                  
                                  if (openGames.length > 0) {
                                    return (
                                      <span className="text-xs text-success-600 dark:text-success-400 font-medium">
                                        <span className="hidden sm:inline">{t('admin.status_open_betting')}</span>
                                        <span className="sm:hidden">{t('admin.status_open_short')}</span>
                                      </span>
                                    );
                                                                     } else if (closedGames.length > 0) {
                                     return (
                                       <span className="text-xs text-error-600 dark:text-error-400 font-medium">
                                         <span className="hidden sm:inline">{t('admin.status_closed_betting')}</span>
                                         <span className="sm:hidden">{t('admin.status_closed_short')}</span>
                                       </span>
                                     );
                                  }
                                  
                                  if (readyGames.length > 0 && openDeadlineWeekId !== Number(weekId)) {
                                    return (
                                      <button
                                        className="btn btn-xs btn-warning whitespace-nowrap"
                                        type="button"
                                        onClick={() => setOpenDeadlineWeekId(Number(weekId))}
                                      >
                                        <span className="hidden sm:inline">{t('admin.open_now_count', { count: readyGames.length })}</span>
                                        <span className="sm:hidden">{t('admin.open_now_count', { count: readyGames.length })}</span>
                                      </button>
                                    );
                                  }
                                  
                                  // Original button for upcoming weeks
                                  if (week && week.status && week.status.toLowerCase() === 'upcoming' && openDeadlineWeekId !== Number(weekId)) {
                                    return (
                                      <button
                                        className="btn btn-xs btn-primary"
                                        type="button"
                                        onClick={() => setOpenDeadlineWeekId(Number(weekId))}
                                      >
                                        {t('admin.open_betting')}
                                      </button>
                                    );
                                  }
                                  
                                  return null;
                                })()}
                              </div>
                            </div>
                            {openDeadlineWeekId === Number(weekId) && (
                              <div className="mb-2 p-2 bg-secondary-50 dark:bg-secondary-900/30 rounded">
                                <div className="font-semibold mb-2">{t('admin.choose_betting_deadline')}</div>
                                {["12", "6", "2"].map(hours => (
                                  <button
                                    key={hours}
                                    type="button"
                                    className={`btn btn-xs mr-2 btn-secondary`}
                                    disabled={deadlineLoading}
                                    onClick={() => handleOpenBetting(hours)}
                                  >
                                    {t('admin.hours_before_game', { hours })}
                                  </button>
                                ))}
                                <button
                                  className="btn btn-xs btn-secondary"
                                  type="button"
                                  disabled={deadlineLoading}
                                  onClick={() => setOpenDeadlineWeekId(null)}
                                >
                                  {t('admin.cancel')}
                                </button>
                              </div>
                            )}
                            {weekGames.map((game) => {
                              const isExpanded = expandedGames.has(game.id);
                              const primaryStatus = getGamePrimaryStatus(game);
                              
                              return (
                                <div key={game.id} className="border border-secondary-200 dark:border-secondary-700 rounded-lg bg-secondary-50 dark:bg-secondary-900/30 mb-2 overflow-hidden">
                                  {/* Mobile-First: Simplified Main Card (Always Visible) */}
                                  <div 
                                    className="p-3 lg:p-4 cursor-pointer lg:cursor-default"
                                    onClick={() => window.innerWidth < 1024 ? toggleGameExpansion(game.id) : undefined}
                                  >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                                      {/* Teams Section */}
                                      <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                                                    <TeamLogo 
                            teamName={game.homeTeamName || ''}
                            logoUrl={game.homeTeamLogo}
                            className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover flex-shrink-0"
                            alt={game.homeTeamName}
                          />
                                          <span className="font-medium truncate text-sm lg:text-base max-w-[100px] lg:max-w-[120px]">{game.homeTeamName || t('admin.tbd')}</span>
                                        </div>
                                        <span className="text-secondary-500 text-sm flex-shrink-0">{t('admin.vs')}</span>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="font-medium truncate text-sm lg:text-base max-w-[100px] lg:max-w-[120px]">{game.awayTeamName || t('admin.tbd')}</span>
                                                                    <TeamLogo 
                            teamName={game.awayTeamName || ''}
                            logoUrl={game.awayTeamLogo}
                            className="w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover flex-shrink-0"
                            alt={game.awayTeamName}
                          />
                                        </div>
                                      </div>

                                      {/* Primary Status & Date */}
                                      <div className="flex items-center justify-between lg:justify-end gap-2 flex-shrink-0">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                                          {/* Date */}
                                          <span className="text-xs text-secondary-600 dark:text-secondary-400 lg:order-1">
                                            📅 {game.gameDate && !isNaN(new Date(game.gameDate).getTime())
                                              ? new Date(game.gameDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
                                                ', ' + new Date(game.gameDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
                                              : t('admin.tbd')}
                                          </span>
                                          {/* Primary Status Badge */}
                                          <div className="flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${primaryStatus.color}`}>
                                              {primaryStatus.emoji} {primaryStatus.text}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Mobile: Expand Indicator, Desktop: Actions */}
                                        <div className="flex items-center gap-1">
                                          <div className="lg:hidden">
                                            <span className="text-xs text-secondary-500">
                                              {isExpanded ? '▼' : '▶'}
                                            </span>
                                          </div>
                                          {/* Desktop: Show delete button only */}
                                          <div className="hidden lg:flex lg:items-center lg:gap-1">
                                            <button
                                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400 hover:bg-error-200 dark:hover:bg-error-900/40 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteGame(game.id);
                                              }}
                                              title={t('admin.delete_game')}
                                            >
                                              🗑️
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progressive Disclosure: Detailed Info & Actions (Mobile: Expandable, Desktop: Hidden by default) */}
                                  {(isExpanded || window.innerWidth >= 1024) && (
                                    <div className="px-3 pb-3 lg:hidden border-t border-secondary-200 dark:border-secondary-700 bg-secondary-25 dark:bg-secondary-950/50">
                                      <div className="pt-3 space-y-2">
                                        {/* Detailed Status Information */}
                                        <div className="text-xs space-y-1">
                                          {/* Betting Status Detail */}
                                          {game.bettingStatus && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-secondary-600 dark:text-secondary-400">🎯 {t('admin.betting_status')}:</span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                                game.bettingStatus.status === 'open' ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' :
                                                game.bettingStatus.status === 'ready' ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400' :
                                                game.bettingStatus.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                                'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300'
                                              }`}>
                                                {game.bettingStatus.description}
                                              </span>
                                            </div>
                                          )}
                                                                    {/* Match Status Detail - Removed to avoid duplication with primary status badge above */}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                          <button
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-sm font-medium bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400 hover:bg-error-200 dark:hover:bg-error-900/40 transition-colors min-h-[44px]"
                                            onClick={() => handleDeleteGame(game.id)}
                                          >
                                            🗑️ {t('admin.delete_game')}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </ProtectedRoute>
    </Layout>
  );
}