import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

// EXACT same interfaces as dashboard.tsx to ensure compatibility
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

interface UseDashboardDataResult {
  profile: UserProfile | null;
  currentWeek: Week | null;
  games: Game[];
  leaderboardData: LeaderboardCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancel: () => void;
}

interface UseDashboardDataOptions {
  language: string;
  t: (key: string) => string;
}

/**
 * 🚀 SAFE DASHBOARD DATA HOOK
 * 
 * This hook maintains EXACT same behavior as the original dashboard.tsx implementation
 * to ensure zero breaking changes during migration.
 * 
 * Features:
 * - AbortController cleanup for memory leak prevention
 * - Exact same data transformation logic 
 * - Identical error handling patterns
 * - Same API call sequence and timing
 * - Perfect state shape compatibility
 */
export function useDashboardData(options: UseDashboardDataOptions): UseDashboardDataResult {
  const { language, t } = options;
  
  // Exact same state structure as original
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AbortController for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // EXACT SAME leaderboard initialization logic as original
  const initializeLeaderboardData = useCallback(() => {
    // Localized usernames based on language
    const usernames: Record<string, {
      weekly: string[];
      performance: string[];
      consistent: string[];
      winners: string[];
      streaks: string[];
    }> = {
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

    // EXACT SAME mock data as original - no changes
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
  }, [language, t]);

  // EXACT SAME fetchDashboardData logic as original
  const fetchDashboardData = useCallback(async () => {
    // Cancel previous request if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      
      // EXACT SAME API calls as original
      const [profileRes, weekRes, gamesRes, statsRes] = await Promise.all([
        axios.get('/api/users/profile', { signal: controller.signal }),
        axios.get('/api/weeks/current', { signal: controller.signal }),
        axios.get('/api/games?limit=100', { signal: controller.signal }),
        axios.get('/api/users/stats', { signal: controller.signal })
      ]);
      
      // EXACT SAME debug logging as original
      console.log('[Dashboard Debug] /api/users/profile response:', profileRes.data);
      console.log('[Dashboard Debug] /api/weeks/current response:', weekRes.data);
      console.log('[Dashboard Debug] /api/games response:', gamesRes.data);
      console.log('[Dashboard Debug] /api/users/stats response:', statsRes.data);
      console.log('[Dashboard Debug] Raw games array:', gamesRes.data.games);
      
      // EXACT SAME game mapping logic as original
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
      
      // EXACT SAME sorting logic as original
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
      
      // Only update state if request wasn't aborted
      if (!controller.signal.aborted) {
        // EXACT SAME profile parsing as original
        setProfile({
          ...profileRes.data.user.profile,
          totalBets: Number(profileRes.data.user.profile.totalBets),
          overallPercentage: Number(profileRes.data.user.profile.overallPercentage),
          totalWinnings: Number(profileRes.data.user.profile.totalWinnings),
          bestRankingPosition: Number(profileRes.data.user.profile.bestRankingPosition),
          currentStreak: Number(profileRes.data.user.profile.currentStreak || 0),
          bestWeek: Number(profileRes.data.user.profile.bestWeek || 0)
        });
        
        // EXACT SAME week parsing as original
        setCurrentWeek({
          ...weekRes.data.week,
          status: (weekRes.data.week.status || '').toLowerCase()
        });
        
        setGames(sortedGames);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        console.error('Failed to fetch dashboard data:', err);
        // EXACT SAME error handling as original
        setProfile(null);
        setCurrentWeek(null);
        setGames([]);
        setError('Failed to fetch dashboard data');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // EXACT SAME useEffect patterns as original
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    initializeLeaderboardData();
  }, [initializeLeaderboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    profile,
    currentWeek,
    games,
    leaderboardData,
    loading,
    error,
    refetch: fetchDashboardData,
    cancel
  };
} 