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
import { exchangeRateService } from '@/services/exchangeRateService';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

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
  season?: string;
}

interface Game {
  id: number;
  weekId: number;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: string;
  status: 'scheduled' | 'live' | 'finished';
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

interface SecurityStatus {
  securityStatus: 'SECURE' | 'WARNING' | 'CRITICAL';
  rates: {
    base: string;
    timestamp: number;
    rates: Record<string, number>;
    source: string;
    consensusScore?: number;
  };
  validation: Record<string, any>;
}

interface SecuritySettings {
  monitoringInterval: number; // in minutes
  alertsEnabled: boolean;
  criticalAlertsEnabled: boolean;
  warningAlertsEnabled: boolean;
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

  // 🛡️ SECURITY: Exchange rate monitoring state
  const [securityData, setSecurityData] = useState<SecurityStatus | null>(null);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [lastSecurityCheck, setLastSecurityCheck] = useState<Date | null>(null);
  // Load security settings from localStorage with disabled defaults
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lq247_admin_security_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.warn('Failed to parse saved security settings, using defaults');
        }
      }
    }
    // Default settings with alerts DISABLED
    return {
      monitoringInterval: 1,
      alertsEnabled: false,          // ← DISABLED: Master switch for all alerts
      criticalAlertsEnabled: false,  // ← DISABLED: Critical alerts (suspicious requests)
      warningAlertsEnabled: false    // ← DISABLED: Warning alerts (failed logins)
    };
  });

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

  // 🛡️ SECURITY: Use security monitoring hook with automatic cleanup
  const securityMonitoring = useSecurityMonitoring({
    // Disable security monitoring entirely in development to avoid console spam
    interval: securitySettings.monitoringInterval * 60 * 1000,
    enabled: process.env.NODE_ENV === 'production' && securitySettings.alertsEnabled,
    onMetricsUpdate: (metrics) => {
      // Update our security data when metrics are updated
      setLastSecurityCheck(metrics.lastUpdate);
      
      // Only trigger exchange rate checks in production
      if (process.env.NODE_ENV === 'production') {
        fetchSecurityStatus();
      }
    },
    onSecurityAlert: (alertType, details) => {
      // Handle security alerts based on type
      if (alertType === 'HIGH_SUSPICIOUS_REQUESTS' && securitySettings.criticalAlertsEnabled) {
        toast.error(`🚨 HIGH SUSPICIOUS REQUESTS: ${details.count} detected (threshold: ${details.threshold})`, {
          duration: 10000,
          position: 'top-center'
        });
      } else if (alertType === 'HIGH_FAILED_LOGINS' && securitySettings.warningAlertsEnabled) {
        toast('⚠️ HIGH FAILED LOGINS: ' + details.count + ' detected', {
          duration: 8000,
          position: 'top-center',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          }
        });
             } else if (alertType === 'MONITORING_ERROR') {
        // Silent error handling
      }
    }
  });

  useEffect(() => {
    fetchAdminData();
    fetchTeams();
    
    // In development, set mock security data; in production, fetch real data
    if (process.env.NODE_ENV === 'production') {
      fetchSecurityStatus();
    } else {
      // Set mock security data for development
      setSecurityData({
        securityStatus: 'SECURE',
        rates: {
          base: 'USD',
          timestamp: Date.now(),
          rates: { USD: 1, MXN: 17.5, USDT: 1.001 },
          source: 'development-mock',
          consensusScore: 1
        },
        validation: {
          MXN: { isValid: true, consensusRate: 17.5, deviationPercentage: 0, sources: ['mock'] },
          USDT: { isValid: true, consensusRate: 1.001, deviationPercentage: 0, sources: ['mock'] }
        }
      });
      setLastSecurityCheck(new Date());
      setSecurityLoading(false);
    }
  }, []);

  // 🛡️ SECURITY: Exchange rate monitoring functions
  const fetchSecurityStatus = async () => {
    try {
      setSecurityLoading(true);
      const security = await exchangeRateService.verifyCurrentRates();
      
      // Check for status changes and trigger alerts
      if (securityData && securitySettings.alertsEnabled) {
        const previousStatus = securityData.securityStatus;
        const currentStatus = security.securityStatus;
        
        if (previousStatus !== currentStatus) {
          if (currentStatus === 'CRITICAL' && securitySettings.criticalAlertsEnabled) {
            toast.error('🚨 CRITICAL: Exchange rate security degraded - using fallback rates', {
              duration: 10000,
              position: 'top-center'
            });
          } else if (currentStatus === 'WARNING' && securitySettings.warningAlertsEnabled) {
            toast('⚠️ WARNING: Exchange rate consensus limited - reduced validation', {
              duration: 8000,
              position: 'top-center',
              style: {
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fbbf24'
              }
            });
          } else if (currentStatus === 'SECURE' && previousStatus !== 'SECURE') {
            toast.success('✅ Exchange rate security restored - full consensus achieved', {
              duration: 5000,
              position: 'top-center'
            });
          }
        }
      }
      
      setSecurityData(security);
      setLastSecurityCheck(new Date());
    } catch (error) {
      toast.error('Failed to check exchange rate security status');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleRefreshSecurity = async () => {
    if (process.env.NODE_ENV === 'development') {
      toast('⚠️ Security monitoring disabled in development mode', {
        duration: 3000,
        style: { background: '#fef3c7', color: '#92400e' }
      });
      return;
    }
    await fetchSecurityStatus();
    toast.success('Security status refreshed');
  };

  const handleUpdateSecuritySettings = (newSettings: Partial<SecuritySettings>) => {
    const updatedSettings = { ...securitySettings, ...newSettings };
    setSecuritySettings(updatedSettings);
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('lq247_admin_security_settings', JSON.stringify(updatedSettings));
    }
    
    toast.success('Security monitoring settings updated');
    // Note: The useSecurityMonitoring hook will automatically react to settings changes
  };

  // Clear all existing toast notifications
  const handleClearAllAlerts = () => {
    toast.dismiss(); // Dismiss all active toasts
    setTimeout(() => {
      toast.success('All security alerts cleared');
    }, 100); // Small delay to ensure previous toasts are dismissed
  };

  // Reset security settings to defaults
  const handleResetSecuritySettings = () => {
    const defaultSettings: SecuritySettings = {
      monitoringInterval: 1,
      alertsEnabled: false,
      criticalAlertsEnabled: false,
      warningAlertsEnabled: false
    };
    setSecuritySettings(defaultSettings);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lq247_admin_security_settings');
    }
    
    toast.success('Security settings reset to defaults (alerts disabled)');
  };

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
      
      // Validate the game date before attempting to parse it
      if (!newGame.gameDate || newGame.gameDate.trim() === '') {
        throw new Error('Game date is required');
      }
      
      console.log('[DEBUG] Form state before processing:', {
        gameDate: newGame.gameDate,
        rawGameDate: gameDate,
        gameHour,
        gameMinute,
        selectedWeekId: newGame.weekId,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Create the game date with explicit timezone handling for production compatibility
      let matchDateISO: string;
      try {
        // Parse the date components explicitly to avoid timezone issues
        const [year, month, day] = newGame.gameDate.split('-').map(num => parseInt(num, 10));
        const hour = parseInt(gameHour, 10);
        const minute = parseInt(gameMinute, 10);
        
        // Create date in local timezone first, then convert to ISO
        const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        
        console.log('[DEBUG] Date components:', { year, month, day, hour, minute });
        console.log('[DEBUG] Local date created:', localDate);
        console.log('[DEBUG] Local date valid?', !isNaN(localDate.getTime()));
        
        if (isNaN(localDate.getTime())) {
          throw new Error(`Invalid date components: ${year}-${month}-${day} ${hour}:${minute}`);
        }
        
        // Convert to ISO string for backend
        matchDateISO = localDate.toISOString();
        
        console.log('[DEBUG] Final ISO date:', matchDateISO);
      } catch (dateError) {
        console.error('[DEBUG] Date parsing error:', dateError);
        throw new Error(`Failed to parse date: ${dateError instanceof Error ? dateError.message : 'Unknown error'}`);
      }

      const gameData = {
        weekNumber: selectedWeek.weekNumber,
        season: selectedWeek.season,
        homeTeamId: parseInt(newGame.homeTeamId),
        awayTeamId: parseInt(newGame.awayTeamId),
        matchDate: matchDateISO
      };

      console.log('[DEBUG] Game data being sent to backend:', gameData);

      const response = await axiosInstance.post('/admin/games', gameData);

      const result = response.data;
      
      console.log('[DEBUG] Game created successfully:', result);
      toast.success(t('admin.game_created'));
      
      // Reset form
      setNewGame({
        weekId: '',
        homeTeamId: '',
        awayTeamId: '',
        gameDate: ''
      });
      setGameDate('');
      setGameHour('12');
      setGameMinute('00');
      
      // Refresh games list
      fetchAdminData();
    } catch (error) {
      console.error('[DEBUG] Game creation error:', error);
      toast.error(t('admin.game_creation_failed') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
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

  // Demo user bet deletion functionality
  const handleDeleteDemoBets = async () => {
    if (!confirm('🗑️ Delete ALL bets for Demo User?\n\nThis will remove all demo user bets and cannot be undone.\n\nClick OK to proceed.')) {
      return;
    }
    
    try {
      const response = await axiosInstance.delete('/admin/demo-user/bets');
      toast.success(`✅ Deleted ${response.data.deletedCount} demo user bets`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete demo bets:', error);
      toast.error('❌ Failed to delete demo user bets');
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
      // PRIORITY 1: Match status (live/finished) - most important for ongoing games
  if (game.status === 'finished') {
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
  const currentSeason = '2025'; // Default season for generated weeks
  const generatedWeeks: { id: string; weekNumber: number; startDate: string; endDate: string; season: string }[] = [];
  for (let i = 0; i < 9; i++) { // 9 weeks covers ~2 months
    const weekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), i * 7);
    const weekEnd = addDays(weekStart, 6);
    const weekNumber = Number(format(weekStart, 'w'));
    generatedWeeks.push({
      id: `gen-${weekNumber}`,
      weekNumber,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      season: currentSeason
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
      endDate: w.endDate,
      season: w.season || currentSeason // Fallback to current season if missing
    }))
  ];
  allWeeks.sort((a, b) => a.weekNumber - b.weekNumber);

  // Only show future weeks for game creation (not current or past weeks)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today at 00:00
  
  const validWeeks = allWeeks.filter(week => {
    const weekStart = new Date(week.startDate);
    const weekStartDay = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()); // Start of week day
    
    // Only show weeks that START after today
    // This prevents creating games in weeks that have already started or are starting today
    return weekStartDay > todayStart;
  });

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
    if (!date || !hour || !minute) return '';
    
    // Ensure hour and minute are properly formatted
    const formattedHour = hour.padStart(2, '0');
    const formattedMinute = minute.padStart(2, '0');
    
    // Create a properly formatted datetime string
    const dateTimeString = `${date}T${formattedHour}:${formattedMinute}:00`;
    
    // Validate the resulting date string
    const testDate = new Date(dateTimeString);
    if (isNaN(testDate.getTime())) {
      console.warn('Invalid date combination:', { date, hour, minute, result: dateTimeString });
      return '';
    }
    
    return dateTimeString;
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
            
            {activeTab === 'security' && (
              <div className="mb-8">
                <h2 className="section-title">
                  🛡️ {t('admin.security_monitoring')}
                </h2>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-secondary-200 dark:border-secondary-700">
                {['overview', 'users', 'games', 'security'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-primary-600 text-primary-600 font-bold'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
                    }`}
                  >
                    {tab === 'overview' 
                      ? t('dashboard.performance_overview') 
                      : tab === 'games' 
                        ? t('admin.game_management') 
                        : tab === 'users' 
                          ? t('admin.user_management_tab')
                          : tab === 'security'
                            ? `🛡️ ${t('admin.security_monitoring')}`
                            : t(`admin.${tab}`)
                    }
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

                {/* 🛡️ SECURITY: Exchange Rate Security Card - REMOVED FROM OVERVIEW
                    Security monitoring is now available only in the dedicated Security tab
                */}

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
                                  {user.email === 'demo@laquiniela247.mx' ? (
                                    <button
                                      onClick={handleDeleteDemoBets}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                                      title="Click to delete all demo user bets"
                                    >
                                      {user.firstName} {user.lastName}
                                    </button>
                                  ) : (
                                    <span>{user.firstName} {user.lastName}</span>
                                  )}
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
                            const now = new Date();
                            const openWeeks = weeks.filter(week => 
                              week.status?.toLowerCase() === 'open' && 
                              week.bettingDeadline && 
                              new Date(week.bettingDeadline) > now
                            );
                            
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
                      const now = new Date();
                      const openWeeks = weeks.filter(week => 
                        week.status?.toLowerCase() === 'open' && 
                        week.bettingDeadline && 
                        new Date(week.bettingDeadline) > now
                      ).length;
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
                                          <span className="font-medium truncate text-sm lg:text-base max-w-[100px] lg:max-w-[120px] text-secondary-900 dark:text-secondary-100">{game.homeTeamName || t('admin.tbd')}</span>
                                        </div>
                                        <span className="text-secondary-500 text-sm flex-shrink-0">{t('admin.vs')}</span>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="font-medium truncate text-sm lg:text-base max-w-[100px] lg:max-w-[120px] text-secondary-900 dark:text-secondary-100">{game.awayTeamName || t('admin.tbd')}</span>
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
                                        {/* Detailed Status Information - Removed betting status to avoid duplication with primary status badge above */}

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

            {/* 🛡️ SECURITY TAB: Dedicated Security Monitoring Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                {/* Security Settings Card */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">⚙️ Monitoring Configuration</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Monitoring Interval */}
                      <div>
                        <label htmlFor="monitoring-interval" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Monitoring Interval (minutes)
                        </label>
                        <select
                          id="monitoring-interval"
                          value={securitySettings.monitoringInterval}
                          onChange={(e) => handleUpdateSecuritySettings({ monitoringInterval: parseInt(e.target.value) })}
                          className="form-input"
                        >
                          <option value={1}>1 minute</option>
                          <option value={2}>2 minutes</option>
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                        </select>
                        <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                          How often to check exchange rate security automatically
                        </p>
                      </div>

                      {/* Alert Toggles */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Alert Types
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.alertsEnabled}
                              onChange={(e) => handleUpdateSecuritySettings({ alertsEnabled: e.target.checked })}
                              className="form-checkbox mr-2"
                            />
                            <span className="text-sm">Enable All Alerts</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.criticalAlertsEnabled}
                              onChange={(e) => handleUpdateSecuritySettings({ criticalAlertsEnabled: e.target.checked })}
                              disabled={!securitySettings.alertsEnabled}
                              className="form-checkbox mr-2"
                            />
                            <span className="text-sm text-red-600">🚨 Critical Alerts</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.warningAlertsEnabled}
                              onChange={(e) => handleUpdateSecuritySettings({ warningAlertsEnabled: e.target.checked })}
                              disabled={!securitySettings.alertsEnabled}
                              className="form-checkbox mr-2"
                            />
                            <span className="text-sm text-yellow-600">⚠️ Warning Alerts</span>
                          </label>
                        </div>
                        
                        {/* Quick Action Buttons */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={handleClearAllAlerts}
                            className="btn-outline text-xs"
                          >
                            🧹 Clear All Alerts
                          </button>
                          <button
                            onClick={handleResetSecuritySettings}
                            className="btn-outline text-xs"
                          >
                            🔄 Reset to Defaults
                          </button>
                        </div>
                      </div>

                      {/* Status Summary */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Current Status
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              securitySettings.alertsEnabled ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-sm">
                              Monitoring: {securitySettings.alertsEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <div className="text-sm text-secondary-600 dark:text-secondary-400">
                            Next check: {securitySettings.alertsEnabled ? `${securitySettings.monitoringInterval} min` : 'N/A'}
                          </div>
                          {lastSecurityCheck && (
                            <div className="text-sm text-secondary-600 dark:text-secondary-400">
                              Last check: {lastSecurityCheck.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Security Status */}
                <div className="card">
                  <div className="card-header border-b border-secondary-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                      <h3 className="card-title flex items-center">
                        📊 Real-time Security Dashboard
                        {securityLoading && (
                          <div className="ml-2 animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                        )}
                      </h3>
                      <button
                        onClick={handleRefreshSecurity}
                        disabled={securityLoading}
                        className="btn-outline-sm"
                      >
                        {securityLoading ? 'Checking...' : '🔄 Refresh Now'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {securityData ? (
                      <div className="space-y-6">
                        {/* Security Status Overview */}
                        <div className={`p-4 rounded-lg border ${
                          securityData.securityStatus === 'SECURE' 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : securityData.securityStatus === 'WARNING'
                              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${
                                securityData.securityStatus === 'SECURE' 
                                  ? 'bg-green-500' 
                                  : securityData.securityStatus === 'WARNING'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}></div>
                              <div>
                                <div className="font-semibold text-lg">
                                  {securityData.securityStatus === 'SECURE' && '✅ SECURE'}
                                  {securityData.securityStatus === 'WARNING' && '⚠️ WARNING'}
                                  {securityData.securityStatus === 'CRITICAL' && '🚨 CRITICAL'}
                                </div>
                                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                                  {securityData.securityStatus === 'SECURE' && 'All exchange rate providers validated with consensus'}
                                  {securityData.securityStatus === 'WARNING' && 'Limited consensus - using reduced validation'}
                                  {securityData.securityStatus === 'CRITICAL' && 'Exchange rate security degraded - using fallback rates'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-mono">
                                {securityData.rates.consensusScore ? `${(securityData.rates.consensusScore * 100).toFixed(1)}%` : 'N/A'}
                              </div>
                              <div className="text-sm text-secondary-600 dark:text-secondary-400">Consensus</div>
                            </div>
                          </div>
                        </div>

                        {/* Provider Status Grid */}
                        <div>
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-4">Provider Status</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Primary Source</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                              <div className="mt-2 text-lg font-mono">{securityData.rates.source}</div>
                            </div>
                            
                            <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Last Update</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                              <div className="mt-2 text-sm">
                                {new Date(securityData.rates.timestamp).toLocaleString()}
                              </div>
                            </div>

                            <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Validation Score</span>
                                <div className={`w-2 h-2 rounded-full ${
                                  securityData.securityStatus === 'SECURE' ? 'bg-green-500' : 
                                  securityData.securityStatus === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                              </div>
                              <div className="mt-2 text-lg font-mono">
                                {securityData.rates.consensusScore ? `${(securityData.rates.consensusScore * 100).toFixed(1)}%` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Current Exchange Rates */}
                        <div>
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-4">Current Exchange Rates</h4>
                          <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {Object.entries(securityData.rates.rates).map(([currency, rate]) => (
                                <div key={currency} className="text-center">
                                  <div className="text-sm text-secondary-600 dark:text-secondary-400">{securityData.rates.base}/{currency}</div>
                                  <div className="text-lg font-mono font-semibold">{rate.toFixed(4)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Technical Details */}
                        <div>
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-4">Technical Validation Details</h4>
                          <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(securityData.validation, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {/* Manual Actions */}
                        <div>
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-4">Manual Actions</h4>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleRefreshSecurity}
                              disabled={securityLoading}
                              className="btn-primary"
                            >
                              🔄 Force Refresh
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(securityData, null, 2));
                                toast.success('Security data copied to clipboard');
                              }}
                              className="btn-outline"
                            >
                              📋 Copy Data
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(securityData, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `security-report-${Date.now()}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast.success('Security report downloaded');
                              }}
                              className="btn-outline"
                            >
                              💾 Download Report
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <div className="text-secondary-600 dark:text-secondary-400">
                          Loading security status...
                        </div>
                      </div>
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