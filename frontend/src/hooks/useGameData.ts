import { useMemo, useCallback } from 'react';
import { useApiRequest } from './useApiRequest';

// Re-export types that are needed for game data
export interface Game {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  gameDate: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  weekId?: number;
  userBet?: {
    prediction: 'home' | 'away' | 'draw';
    isCorrect: boolean | null;
  };
  bettingClosed?: boolean;
  bettingDeadline?: string;
  weekStatus?: string;
}

export interface Week {
  id: number;
  weekNumber: number;
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  bettingDeadline: string;
  canBet?: boolean;
}

export interface BetStatus {
  canBet: boolean;
  hasPlacedAllBets: boolean;
  placedBetsCount: number;
  totalGamesCount: number;
}

// API Response Types  
interface AdminGameResponse {
  id: number;
  homeTeam?: { name: string; logoUrl?: string };
  awayTeam?: { name: string; logoUrl?: string };
  matchDate: string;
  status?: string;
  weekNumber?: number;
  week?: { weekNumber: number };
  homeScore?: number;
  awayScore?: number;
}

interface AdminGamesApiResponse {
  games: AdminGameResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

interface BettingDataResponse {
  games: Array<{
    id: number;
    homeTeam?: { name: string; logoUrl?: string };
    awayTeam?: { name: string; logoUrl?: string };
    matchDate: string;
    status?: string;
    homeScore?: number;
    awayScore?: number;
    userBet?: {
      prediction: string;
      isCorrect: boolean | null;
    };
    weekNumber: number;
    bettingDeadline?: string;
  }>;
  week: {
    id: number;
    weekNumber: number;
    status: string;
    bettingDeadline: string;
    canBet?: boolean;
  };
  betStatus: BetStatus;
  canBet: boolean;
}

interface UseGameDataOptions {
  isAdmin: boolean;
  tab?: 'single' | 'parlay';
  user?: any; // User object from auth context
}

interface UseGameDataResult {
  games: Game[];
  currentWeek: Week | null;
  betStatus: BetStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancel: () => void;
}

/**
 * Specialized hook for fetching game data with proper typing and data transformation
 * Handles both admin and betting data with automatic cleanup
 */
export function useGameData(options: UseGameDataOptions): UseGameDataResult {
  const { isAdmin, tab, user } = options;

  // Generate URL based on admin/user mode
  const urlGenerator = useCallback(() => {
    if (isAdmin) {
      return '/api/admin/games';
    } else {
      return `/api/games/current-week${tab ? `?betType=${tab}` : ''}`;
    }
  }, [isAdmin, tab]);

  // Use the base API request hook
  const {
    data: rawData,
    loading,
    error,
    refetch,
    cancel
  } = useApiRequest<AdminGamesApiResponse | BettingDataResponse>(
    urlGenerator,
    {
      dependencies: [user, isAdmin, tab],
      immediate: !!user // Only fetch when user is loaded
    }
  );

  // Transform data based on response type
  const transformedData = useMemo(() => {
    if (!rawData) {
      return {
        games: [],
        currentWeek: null,
        betStatus: null
      };
    }

    if (isAdmin) {
      // Handle admin games response - extract games from the response object
      const adminResponse = rawData as AdminGamesApiResponse;
      const adminGames = adminResponse?.games || [];
      
      // 🔍 DEBUG: Log admin games parsing
      console.log('[useGameData] Admin API Response:', {
        hasData: !!adminResponse,
        gamesCount: adminGames.length,
        firstGame: adminGames[0] ? {
          id: adminGames[0].id,
          homeTeam: adminGames[0].homeTeam?.name,
          awayTeam: adminGames[0].awayTeam?.name,
          week: adminGames[0].weekNumber
        } : 'none'
      });
      
      const games: Game[] = adminGames.map((game: AdminGameResponse): Game => ({
        id: game.id,
        homeTeamName: game.homeTeam?.name || 'TBD',
        awayTeamName: game.awayTeam?.name || 'TBD',
        homeTeamLogo: game.homeTeam?.logoUrl,
        awayTeamLogo: game.awayTeam?.logoUrl,
        gameDate: game.matchDate,
        status: (game.status?.toLowerCase() as Game['status']) || 'scheduled',
        weekId: game.weekNumber || game.week?.weekNumber,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      }));

      return {
        games,
        currentWeek: null,
        betStatus: null
      };
    } else {
      // Handle betting data response
      const bettingData = rawData as BettingDataResponse;
      
      if (!bettingData.games) {
        return {
          games: [],
          currentWeek: null,
          betStatus: null
        };
      }

      const games: Game[] = bettingData.games
        .map((game): Game | null => {
          if (!game.homeTeam || !game.awayTeam) {
            console.warn('[Game Data] Skipping game with missing team:', game);
            return null;
          }
          
          return {
            id: game.id,
            homeTeamName: game.homeTeam?.name || '',
            awayTeamName: game.awayTeam?.name || '',
            homeTeamLogo: game.homeTeam?.logoUrl || '',
            awayTeamLogo: game.awayTeam?.logoUrl || '',
            gameDate: game.matchDate || '',
            status: (game.status?.toLowerCase() as Game['status']) || 'scheduled',
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            userBet: game.userBet ? {
              prediction: game.userBet.prediction.toLowerCase() as 'home' | 'away' | 'draw',
              isCorrect: game.userBet.isCorrect
            } : undefined,
            weekId: game.weekNumber,
            bettingClosed: false,
            bettingDeadline: game.bettingDeadline,
            weekStatus: 'open'
          };
        })
        .filter((game): game is Game => game !== null);

      const currentWeek: Week | null = bettingData.week ? {
        ...bettingData.week,
        status: (bettingData.week.status as Week['status']) || 'closed',
        canBet: bettingData.canBet || false
      } : null;

      return {
        games,
        currentWeek,
        betStatus: bettingData.betStatus || null
      };
    }
  }, [rawData, isAdmin]);

  return {
    games: transformedData.games,
    currentWeek: transformedData.currentWeek,
    betStatus: transformedData.betStatus,
    loading,
    error,
    refetch,
    cancel
  };
} 