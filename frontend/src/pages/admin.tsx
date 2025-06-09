import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { addDays, startOfWeek, format, isAfter, isBefore } from 'date-fns';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  status: 'open' | 'closed' | 'completed';
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
      
      // Normalize games data
      const normalizeGame = (game: any) => ({
        id: game.id,
        homeTeamName: game.homeTeamName || game.homeTeam?.name || 'TBD',
        awayTeamName: game.awayTeamName || game.awayTeam?.name || 'TBD',
        gameDate: game.gameDate || game.matchDate || '',
        status: game.status || 'SCHEDULED',
        homeTeamLogo: game.homeTeam?.logoUrl || '',
        awayTeamLogo: game.awayTeam?.logoUrl || '',
      });

      const normalizedGames = (gamesRes.data.games || []).map(normalizeGame);
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
      if (!backendWeek) {
        console.log('[DEBUG] Sending week creation request for game:', selectedWeek);
        const weekRes = await axiosInstance.post('/admin/weeks', {
          weekNumber: selectedWeek.weekNumber,
          season: '2025',
          startDate: selectedWeek.startDate,
          endDate: selectedWeek.endDate,
          bettingDeadline: new Date(new Date(selectedWeek.startDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
        });
        console.log('[DEBUG] Week creation response for game:', weekRes.data);
        // Robustly fetch weeks directly from backend until the new week appears
        let tries = 0;
        while (tries < 5) {
          const res = await axiosInstance.get('/weeks');
          const freshWeeks = res.data.weeks;
          backendWeek = freshWeeks.find((w: any) => w.weekNumber === selectedWeek.weekNumber);
          if (backendWeek) break;
          await new Promise(res => setTimeout(res, 300));
          tries++;
        }
      }
      if (!backendWeek) throw new Error('Failed to create or find week');
      // Create the game
      const matchDateISO = new Date(newGame.gameDate).toISOString();
      console.log('[DEBUG] Sending game creation request:', {
        weekNumber: selectedWeek.weekNumber,
        season: '2025',
        homeTeamId: parseInt(newGame.homeTeamId),
        awayTeamId: parseInt(newGame.awayTeamId),
        matchDate: matchDateISO
      });
      const gameRes = await axiosInstance.post('/admin/games', {
        weekNumber: selectedWeek.weekNumber,
        season: '2025',
        homeTeamId: parseInt(newGame.homeTeamId),
        awayTeamId: parseInt(newGame.awayTeamId),
        matchDate: matchDateISO
      });
      console.log('[DEBUG] Game creation response:', gameRes.data);
      toast.success(t('admin.game_created'));
      setNewGame({ weekId: '', homeTeamId: '', awayTeamId: '', gameDate: '' });
      fetchAdminData();
    } catch (error) {
      console.error('[DEBUG] Failed to create game:', error);
      toast.error(t('admin.game_creation_failed'));
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
    const isSpanish = lang === 'es';
    return new Intl.NumberFormat(isSpanish ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: isSpanish ? 'MXN' : 'USD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await axiosInstance.delete(`/admin/games/${gameId}`);
      toast.success('Game deleted');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to delete game');
    }
  };

  // Add this helper function at the top or bottom of the file
  function combineDateTime(date: string, hour: string, minute: string) {
    if (!date) return '';
    return `${date}T${hour}:${minute}`;
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
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                {t('navigation.admin_panel')}
              </h1>
            </div>

            {/* Performance Overview Section Title */}
            {activeTab === 'overview' && (
              <div className="mb-8">
                <h2 className="section-title">
                  {t('dashboard.performance_overview')}
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
                    <button type="submit" className="btn-primary">
                      {t('admin.create_game')}
                    </button>
                  </form>
                </div>

                {/* Games List */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">{t('admin.existing_games')}</h2>
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
                      ).map(([weekId, weekGames]) => (
                        <div key={weekId} className="space-y-4">
                          <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                            {t('dashboard.week')} {weekGames[0].weekId}
                          </h3>
                          {weekGames.map((game) => (
                            <div key={game.id} className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="font-medium text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                                    {game.homeTeamLogo && (
                                      <img
                                        src={game.homeTeamLogo}
                                        alt={game.homeTeamName}
                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                        style={{ background: '#fff' }}
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    )}
                                    <span>{game.homeTeamName || 'TBD'}</span>
                                    <span className="mx-2">vs</span>
                                    {game.awayTeamLogo && (
                                      <img
                                        src={game.awayTeamLogo}
                                        alt={game.awayTeamName}
                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                        style={{ background: '#fff' }}
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    )}
                                    <span>{game.awayTeamName || 'TBD'}</span>
                                  </h3>
                                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                                    {game.gameDate && !isNaN(new Date(game.gameDate).getTime()) ? new Date(game.gameDate).toLocaleString() : 'TBD'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    game.status === 'completed'
                                      ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                                      : game.status === 'live'
                                      ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                                      : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300'
                                  }`}>
                                    {(() => {
                                      const statusKey = `admin.${game.status.toLowerCase()}`;
                                      const translatedStatus = t(statusKey);
                                      const fallbackStatus = t('admin.scheduled');
                                      return translatedStatus === statusKey ? fallbackStatus : translatedStatus;
                                    })()}
                                  </span>
                                  <button
                                    className="btn-danger btn-xs ml-2"
                                    onClick={() => handleDeleteGame(game.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              
                              {game.status === 'scheduled' && (
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="number"
                                    placeholder={t('admin.home_score')}
                                    className="form-input w-20"
                                    id={`home-score-${game.id}`}
                                  />
                                  <span className="text-secondary-500 dark:text-secondary-400">-</span>
                                  <input
                                    type="number"
                                    placeholder={t('admin.away_score')}
                                    className="form-input w-20"
                                    id={`away-score-${game.id}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const homeScore = parseInt((document.getElementById(`home-score-${game.id}`) as HTMLInputElement).value);
                                      const awayScore = parseInt((document.getElementById(`away-score-${game.id}`) as HTMLInputElement).value);
                                      if (!isNaN(homeScore) && !isNaN(awayScore)) {
                                        handleUpdateGameResult(game.id, homeScore, awayScore);
                                      }
                                    }}
                                    className="btn-primary"
                                  >
                                    {t('admin.update_result')}
                                  </button>
                                </div>
                              )}
                              
                              {game.status === 'completed' && (
                                <div className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                                  {t('admin.final_score')}: {game.homeScore} - {game.awayScore}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))
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