import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useDemo } from '@/context/DemoContext';
import { useCurrency, Currency } from '@/context/CurrencyContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CurrencySelector } from '@/components/ui/CurrencySelector';
import TeamLogo from '@/components/TeamLogo';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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
  weekId?: number;
  userBet?: {
    prediction: PredictionType;
    isCorrect: boolean | null;
  };
  bettingClosed?: boolean;
  bettingDeadline?: string;
  weekStatus?: string;
}

interface Week {
  id: number;
  weekNumber: number;
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  bettingDeadline: string;
}

type PredictionType = 'home' | 'away' | 'draw';

interface Prediction {
  gameId: number;
  prediction: PredictionType;
}

interface FormattedAmountProps {
  amount: number;
  originalCurrency?: Currency;
  className?: string;
}

function FormattedAmount({ amount, originalCurrency, className }: FormattedAmountProps) {
  const { formatAmount } = useCurrency();
  const [formattedValue, setFormattedValue] = useState<string>('$0.00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadFormattedAmount = async () => {
      try {
        setIsLoading(true);
        const formatted = await formatAmount(amount, originalCurrency);
        if (isMounted) {
          setFormattedValue(formatted);
        }
      } catch (error) {
        console.error('Error formatting amount:', error);
        if (isMounted) {
          setFormattedValue(`$${amount.toFixed(2)}`); // fallback
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFormattedAmount();

    return () => {
      isMounted = false;
    };
  }, [amount, originalCurrency, formatAmount]);

  if (isLoading) {
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formattedValue}</span>;
}

export default function BetPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { isDemoUser } = useDemo();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Record<number, PredictionType>>({});
  const [betAmount, setBetAmount] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'parlay' | 'single'>('parlay');
  // For single bets
  const [singleBetAmounts, setSingleBetAmounts] = useState<Record<number, number>>({});
  const [singleSubmitting, setSingleSubmitting] = useState<Record<number, boolean>>({});
  // Add state for tracking single bet summary
  const [singleBetSummary, setSingleBetSummary] = useState<{ totalBets: number; totalAmount: number; potentialWinnings: number }>({
    totalBets: 0,
    totalAmount: 0,
    potentialWinnings: 0
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAdminGamesData();
    } else {
      fetchBettingData();
    }
  }, [isAdmin]);

  // Removed automatic refresh - users can manually refresh if needed
  // The constant 30-second refresh was causing UX issues on mobile

  const fetchAdminGamesData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/games');
      const adminGames = response.data.games.map((game: any) => ({
        id: game.id,
        homeTeamName: game.homeTeam?.name || 'TBD',
        awayTeamName: game.awayTeam?.name || 'TBD',
        homeTeamLogo: game.homeTeam?.logoUrl,
        awayTeamLogo: game.awayTeam?.logoUrl,
        gameDate: game.matchDate,
        status: game.status?.toLowerCase() || 'scheduled',
        weekId: game.weekNumber || game.week?.weekNumber,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      }));
      console.log('[Admin Games Debug] Fetched games:', adminGames.map((g: Game) => ({ id: g.id, status: g.status, weekId: g.weekId, gameDate: g.gameDate })));
      setGames(adminGames);
    } catch (error) {
      console.error('Failed to fetch admin games data:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBettingData = async () => {
    try {
      // Fetch all open weeks and their games from the updated endpoint
      const gamesRes = await axios.get('/api/games/current-week');
      const gamesData = gamesRes.data;
      
      console.log('[Bet Debug] Multi-week games response:', gamesData);
      
      if (gamesData && gamesData.games) {
        // Map backend games to frontend shape with defensive checks
        const mappedGames = (gamesData.games || []).map((game: any) => {
          if (!game.homeTeam || !game.awayTeam) {
            console.warn('[Bet Debug] Skipping game with missing team:', game);
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
            userBet: game.userBet,
            weekId: game.weekNumber,
            bettingClosed: false, // Handled by backend filtering now
            bettingDeadline: gamesData.week?.bettingDeadline,
            weekStatus: 'open' // All games from this endpoint are from open weeks
          };
        }).filter(Boolean);
        // Filter out past games - only show games that haven't started yet
        const now = new Date();
        const futureGames = mappedGames.filter((game: Game) => {
          const gameDate = new Date(game.gameDate);
          return gameDate > now; // Only games in the future
        });
        
        console.log('[Bet Debug] Mapped games from all open weeks:', mappedGames);
        console.log('[Bet Debug] Future games after filtering:', futureGames);
        setGames(futureGames);
      }
      
      // Set the primary week from the response
      if (gamesData && gamesData.week) {
        setCurrentWeek({
          ...gamesData.week,
          status: (gamesData.week.status || '').toLowerCase(),
          canBet: gamesData.canBet || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch betting data:', error);
      // Set mock data for demo
      /*
      setCurrentWeek({
        id: 1,
        weekNumber: 15,
        status: 'open',
        bettingDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      });
      setGames([
        {
          id: 1,
          homeTeamName: 'Club América',
          awayTeamName: 'Chivas Guadalajara',
          gameDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        },
        {
          id: 2,
          homeTeamName: 'Cruz Azul',
          awayTeamName: 'Pumas UNAM',
          gameDate: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        },
        {
          id: 3,
          homeTeamName: 'Tigres UANL',
          awayTeamName: 'Monterrey',
          gameDate: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        },
        {
          id: 4,
          homeTeamName: 'León',
          awayTeamName: 'Santos Laguna',
          gameDate: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        },
        {
          id: 5,
          homeTeamName: 'Toluca',
          awayTeamName: 'Atlas',
          gameDate: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        },
        {
          id: 6,
          homeTeamName: 'Pachuca',
          awayTeamName: 'Necaxa',
          gameDate: new Date(Date.now() + 29 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        }
      ]);
      */
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionChange = (gameId: number, prediction: PredictionType) => {
    setPredictions(prev => ({
      ...prev,
      [gameId]: prediction
    }));
  };

  // Update single bet amounts calculation
  useEffect(() => {
    const selectedGames = Object.keys(predictions).filter(gameId => 
      tab === 'single' && predictions[parseInt(gameId)]
    );
    const totalAmount = selectedGames.reduce((sum, gameId) => 
      sum + (singleBetAmounts[parseInt(gameId)] || 50), 0
    );
    const potentialWinnings = totalAmount * 2.5; // 2.5x multiplier for single bets
    
    setSingleBetSummary({
      totalBets: selectedGames.length,
      totalAmount,
      potentialWinnings
    });
  }, [predictions, singleBetAmounts, tab]);

  // Modified calculate function for La Quiniela fixed amounts
  const calculatePotentialWinnings = () => {
    if (tab === 'parlay') {
      // Fixed amounts for La Quiniela
      return Object.keys(predictions).length === games.length ? 2000 : 0;
    }
    // For single bets, return summary calculation
    return singleBetSummary.potentialWinnings;
  };

  // Modified bet amount for La Quiniela
  const getEffectiveBetAmount = () => {
    if (tab === 'parlay') {
      return 200; // Fixed amount for La Quiniela
    }
    return singleBetSummary.totalAmount;
  };

  const timeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return t('betting.deadline_passed');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Type guard for userBet
  function isUserBet(bet: any): bet is { prediction: string; isCorrect: boolean | null } {
    return (
      bet &&
      typeof bet === 'object' &&
      typeof bet.prediction === 'string' &&
      bet.prediction.trim() !== ''
    );
  }

  // --- Single Bet Submission ---
  const handleSingleBet = async (gameId: number) => {
    const prediction = predictions[gameId];
    const amount = singleBetAmounts[gameId] || 50;
    if (!prediction) {
      toast.error(t('betting.select_prediction'));
      return;
    }
    if (amount < 10) {
      toast.error(t('betting.minimum_bet_amount'));
      return;
    }
    setSingleSubmitting((prev) => ({ ...prev, [gameId]: true }));
    try {
      await axios.post('/api/bets', { gameId, prediction: prediction.toUpperCase(), amount });
      toast.success(t('betting.bet_placed'));
      setPredictions((prev) => {
        const { [gameId]: _, ...rest } = prev;
        return rest;
      });
      setSingleBetAmounts((prev) => ({ ...prev, [gameId]: 50 }));
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t('betting.bet_failed'));
      }
    } finally {
      setSingleSubmitting((prev) => ({ ...prev, [gameId]: false }));
    }
  };

  // --- Parlay (All-at-once) Submission ---
  const handleSubmitParlay = async () => {
    if (Object.keys(predictions).length !== games.length) {
      toast.error(t('betting.select_all_games'));
      return;
    }
    
    const effectiveAmount = getEffectiveBetAmount();
    if (effectiveAmount < 10) {
      toast.error(t('betting.minimum_bet_amount'));
      return;
    }
    
    setSubmitting(true);
    try {
      const betData = {
        weekNumber: currentWeek?.weekNumber,
        bets: Object.entries(predictions).map(([gameId, prediction]) => ({
          gameId: parseInt(gameId),
          prediction: (prediction as string).toUpperCase()
        })),
        amount: effectiveAmount
      };
      await axios.post('/api/bets/multi', betData);
      toast.success(t('betting.bet_placed'));
      setPredictions({});
      setBetAmount(50);
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t('betting.bet_failed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user can bet on this game
  const canBetOnGame = (game: Game) => {
    // Can't bet if user already has a bet
    if (game.userBet) return false;
    
    // Can't bet if betting is closed for this game
    if (game.bettingClosed) return false;
    
    // Can't bet if current week doesn't allow betting
    if (!currentWeek || currentWeek.status !== 'open') return false;
    
    // Check if betting deadline has passed for the current week
    if (currentWeek.bettingDeadline && new Date() >= new Date(currentWeek.bettingDeadline)) {
      return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <Layout title={t('betting.place_bet')}>
        <ProtectedRoute>
          <div className="flex items-center justify-center min-h-96">
            <div className="spinner"></div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  // Admin view - don't check betting status
  if (isAdmin) {
    return (
      <Layout title={t('admin.scheduled_games')}>
        <ProtectedRoute>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="page-title">
                {t('admin.scheduled_games')}
              </h1>
            </div>
            
            {/* Scheduled Games Section */}
            <div className="mb-8">
              <h2 className="section-title">
                {t('admin.scheduled_games')}
              </h2>
              
              <div className="card">
                <div className="space-y-4">
                  {games.length === 0 ? (
                    <div className="text-center py-8 text-secondary-600 dark:text-secondary-400">
                      {t('admin.no_games_message')}
                    </div>
                  ) : (
                    // Group games by week
                    Object.entries(
                      games.reduce((acc, game) => {
                        const weekId = game.weekId || 'unknown';
                        if (!acc[weekId]) {
                          acc[weekId] = [];
                        }
                        acc[weekId].push(game);
                        return acc;
                      }, {} as Record<string, Game[]>)
                    ).map(([weekId, weekGames]) => (
                      <div key={weekId} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                            {t('dashboard.week')} {weekId}
                          </h3>
                        </div>
                        {weekGames.map((game) => (
                          <div key={game.id} className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-secondary-50 dark:bg-secondary-900/30 mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                              {/* Teams/logos left */}
                              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <TeamLogo 
                                    teamName={game.homeTeamName}
                                    logoUrl={game.homeTeamLogo}
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt={game.homeTeamName}
                                  />
                                  <span className="font-medium truncate max-w-[120px] text-secondary-900 dark:text-secondary-100">{game.homeTeamName}</span>
                                </div>
                                <span className="mx-2 text-secondary-500">{t('admin.vs')}</span>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-medium truncate max-w-[120px] text-secondary-900 dark:text-secondary-100">{game.awayTeamName}</span>
                                  <TeamLogo 
                                    teamName={game.awayTeamName}
                                    logoUrl={game.awayTeamLogo}
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt={game.awayTeamName}
                                  />
                                </div>
                              </div>
                              {/* Badges/buttons right */}
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
                                  {game.gameDate && !isNaN(new Date(game.gameDate).getTime())
                                    ? new Date(game.gameDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) + 
                                      ' ' + new Date(game.gameDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
                                    : t('admin.tbd')}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  game.status === 'finished'
                                    ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                                    : game.status === 'live'
                                    ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                                    : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300'
                                }`}>
                                  {game.status === 'finished' ? t('admin.completed') : 
                                   game.status === 'live' ? `🔴 ${t('admin.live')}` : 
                                   t('admin.scheduled')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  if (!currentWeek || currentWeek.status !== 'open') {
    return (
      <Layout title={t('betting.place_bet')}>
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card text-center py-12">
              <div className="text-secondary-400 dark:text-secondary-500 text-4xl mb-4">⏰</div>
              <h2 className="subsection-title">
                {t('betting.betting_closed')}
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                {t('betting.betting_closed_message')}
              </p>
            </div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  // Render-time debug logs
  console.log('[Render] games:', games);
  console.log('[Render] predictions:', predictions);

  return (
    <Layout title={t('betting.place_bet')}>
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="page-title">
              {t('navigation.games')}
            </h1>
            
            {/* Select Your Predictions heading - moved here for demo users */}
            <h2 className="section-title">
              {t('betting.select_predictions')}
            </h2>
          </div>
          
          {currentWeek && (
            <div className={`text-white rounded-lg p-6 mb-6 ${
              currentWeek.bettingDeadline && new Date() >= new Date(currentWeek.bettingDeadline) 
                ? 'bg-error-600' 
                : 'bg-primary-600'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="subsection-title text-white mb-2">
                    {t('dashboard.week')} {currentWeek.weekNumber}
                  </h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    currentWeek.bettingDeadline && new Date() >= new Date(currentWeek.bettingDeadline)
                      ? 'bg-error-800 text-error-100'
                      : 'bg-warning-600 text-secondary-900'
                  }`}>
                    {currentWeek.bettingDeadline && new Date() >= new Date(currentWeek.bettingDeadline)
                      ? t('betting.betting_closed_short')
                      : t('dashboard.open_for_betting')
                    }
                  </span>
                </div>
                <div className="mt-4 sm:mt-0 bg-secondary-900 text-white px-4 py-2 rounded-lg">
                  <div className="text-sm opacity-90">
                    {currentWeek.bettingDeadline && new Date() >= new Date(currentWeek.bettingDeadline)
                      ? t('betting.betting_closed_at')
                      : t('dashboard.betting_closes_in')
                    }
                  </div>
                  <div className="font-bold text-lg">
                    {timeUntilDeadline(currentWeek.bettingDeadline)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Tabs */}
          <div className="flex mb-8 border-b-2 border-secondary-200 dark:border-secondary-700">
            <button
              className={`px-6 py-3 font-semibold focus:outline-none transition-colors ${tab === 'single' ? 'border-b-4 border-primary-600 text-primary-700 dark:text-primary-300' : 'text-secondary-500 dark:text-secondary-400'}`}
              onClick={() => setTab('single')}
            >
              {t('betting.single_bets')}
            </button>
            <button
              className={`ml-2 px-6 py-3 font-semibold focus:outline-none transition-colors ${tab === 'parlay' ? 'border-b-4 border-primary-600 text-primary-700 dark:text-primary-300' : 'text-secondary-500 dark:text-secondary-400'}`}
              onClick={() => setTab('parlay')}
            >
              {t('betting.weekly_parlay')}
            </button>
          </div>

          {tab === 'single' ? (
            Array.isArray(games) && games.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Games List for Single Bets */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    {games.map((game) => {
                      console.log('[Render] game:', game);
                      const hasUserBet = isUserBet(game.userBet);
                      return (
                        <div key={game.id} className="card">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                              <div className="flex items-center space-x-2">
                                <TeamLogo 
                                  teamName={game.homeTeamName}
                                  logoUrl={game.homeTeamLogo}
                                  className="team-logo"
                                  alt={game.homeTeamName}
                                />
                                <span className="font-medium text-secondary-900 dark:text-secondary-100">{game.homeTeamName}</span>
                              </div>
                              <span className="text-secondary-500 dark:text-secondary-400 font-bold">VS</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-secondary-900 dark:text-secondary-100">{game.awayTeamName}</span>
                                <TeamLogo 
                                  teamName={game.awayTeamName}
                                  logoUrl={game.awayTeamLogo}
                                  className="team-logo"
                                  alt={game.awayTeamName}
                                />
                              </div>
                            </div>
                            <div className="text-sm text-secondary-600 dark:text-secondary-400">
                              {new Date(game.gameDate).toLocaleDateString()} {new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {/* Prediction Buttons or User Bet Info */}
                          {canBetOnGame(game) ? (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <button
                                onClick={() => handlePredictionChange(game.id, 'home')}
                                className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${predictions[game.id] === 'home' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                              >
                                {t('betting.home_team')}
                                <div className="text-xs opacity-75 mt-1">{game.homeTeamName}</div>
                              </button>
                              <button
                                onClick={() => handlePredictionChange(game.id, 'draw')}
                                className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${predictions[game.id] === 'draw' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                              >
                                {t('betting.draw')}
                              </button>
                              <button
                                onClick={() => handlePredictionChange(game.id, 'away')}
                                className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${predictions[game.id] === 'away' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                              >
                                {t('betting.away_team')}
                                <div className="text-xs opacity-75 mt-1">{game.awayTeamName}</div>
                              </button>
                            </div>
                          ) : game.userBet ? (
                            <div className="mb-2 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <span className="font-semibold text-success-700 dark:text-success-300">{t('betting.bet_placed')}</span>
                                <span className="ml-2">
                                  {t('betting.your_prediction')}: <b>{
                                    (() => {
                                      const pred = (game.userBet?.prediction || '').toLowerCase();
                                      if (pred === 'home') return t('betting.home_team');
                                      if (pred === 'away') return t('betting.away_team');
                                      if (pred === 'draw') return t('betting.draw');
                                      return game.userBet?.prediction;
                                    })()
                                  }</b>
                                </span>
                              </div>
                              {game.userBet?.isCorrect !== null && game.userBet?.isCorrect !== undefined && (
                                <span className={`ml-4 font-bold ${game.userBet.isCorrect ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'}`}>
                                  {game.userBet.isCorrect ? t('betting.correct') : t('betting.incorrect')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="mb-2 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg text-center">
                              <span className="font-semibold text-error-700 dark:text-error-300">
                                🔒 {t('betting.betting_closed_short')}
                              </span>
                              <div className="text-sm text-error-600 dark:text-error-400 mt-1">
                                {game.bettingDeadline && (
                                  t('betting.betting_closed_on', {
                                    date: new Date(game.bettingDeadline).toLocaleDateString(),
                                    time: new Date(game.bettingDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  })
                                )}
                              </div>
                            </div>
                          )}
                          {/* Bet Amount and Place Bet */}
                          {canBetOnGame(game) && (
                            <div className="flex items-center gap-1 mt-2">
                              <CurrencySelector size="sm" className="w-14 text-xs" />
                              <input
                                type="number"
                                min={10}
                                max={1000}
                                value={singleBetAmounts[game.id] || 50}
                                onChange={e => setSingleBetAmounts(prev => ({ ...prev, [game.id]: Number(e.target.value) }))}
                                className="form-input w-16 text-sm"
                                placeholder="50"
                              />
                              <button
                                onClick={() => handleSingleBet(game.id)}
                                disabled={singleSubmitting[game.id] || !predictions[game.id] || (singleBetAmounts[game.id] || 50) < 10}
                                className={`btn-primary text-sm px-3 py-1 ${singleSubmitting[game.id] || !predictions[game.id] || (singleBetAmounts[game.id] || 50) < 10 ? 'btn-disabled' : ''}`}
                              >
                                {singleSubmitting[game.id] ? <div className="spinner-sm mr-1"></div> : null}
                                {t('betting.place_bet')}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="lg:col-span-1">
                  {/* Bet Summary for Single Bets */}
                  <div className="card sticky top-8">
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                      {t('betting.bet_summary')}
                    </h3>
                    {/* Active Bets Count */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {t('betting.active_bets')}
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          {singleBetSummary.totalBets}
                        </span>
                      </div>
                    </div>
                    {/* Total Bet Amount */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-secondary-600 dark:text-secondary-400">
                          {t('betting.bet_amount')}
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          <FormattedAmount amount={singleBetSummary.totalAmount} />
                        </span>
                      </div>
                    </div>
                    {/* Potential Winnings */}
                    <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-success-700 dark:text-success-300 font-medium">{t('betting.potential_winnings')}</span>
                        <span className="text-success-700 dark:text-success-300 font-bold text-lg">
                          <FormattedAmount amount={singleBetSummary.potentialWinnings} />
                        </span>
                      </div>
                    </div>
                    {singleBetSummary.totalBets === 0 && (
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
                        Select predictions and set amounts to see your bet summary
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-secondary-500 dark:text-secondary-400">
                {t('betting.no_games_available') || 'No games available.'}
              </div>
            )
          ) : (
          // --- Weekly Parlay Tab (existing UI, but update submission) ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Games List (existing code) */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {games.map((game) => (
                  <div key={game.id} className="card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="flex items-center space-x-2">
                          <TeamLogo 
                            teamName={game.homeTeamName}
                            logoUrl={game.homeTeamLogo}
                            className="team-logo"
                            alt={game.homeTeamName}
                          />
                          <span className="font-medium text-secondary-900 dark:text-secondary-100">{game.homeTeamName}</span>
                        </div>
                        <span className="text-secondary-500 dark:text-secondary-400 font-bold">VS</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-secondary-900 dark:text-secondary-100">{game.awayTeamName}</span>
                          <TeamLogo 
                            teamName={game.awayTeamName}
                            logoUrl={game.awayTeamLogo}
                            className="team-logo"
                            alt={game.awayTeamName}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {new Date(game.gameDate).toLocaleDateString()} {new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {/* Prediction Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handlePredictionChange(game.id, 'home')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${predictions[game.id] === 'home' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                      >
                        {t('betting.home_team')}
                        <div className="text-xs opacity-75 mt-1">{game.homeTeamName}</div>
                      </button>
                      <button
                        onClick={() => handlePredictionChange(game.id, 'draw')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${predictions[game.id] === 'draw' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                      >
                        {t('betting.draw')}
                      </button>
                      <button
                        onClick={() => handlePredictionChange(game.id, 'away')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${predictions[game.id] === 'away' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                      >
                        {t('betting.away_team')}
                        <div className="text-xs opacity-75 mt-1">{game.awayTeamName}</div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Bet Summary (existing code) */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                <h3 className="subsection-title">
                  {t('betting.bet_summary')}
                </h3>
                {/* Predictions Count */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {t('betting.predictions_made')}
                    </span>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      {Object.keys(predictions).length} / {games.length}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(Object.keys(predictions).length / games.length) * 100}%` }}></div>
                  </div>
                </div>
                {/* Bet Amount */}
                <div className="mb-6">
                  <label className="form-label">{t('betting.bet_amount')}</label>
                  {tab === 'parlay' ? (
                    <div className="flex items-center gap-2">
                      <CurrencySelector size="sm" className="w-14 text-xs" />
                      <span className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                        <FormattedAmount amount={getEffectiveBetAmount()} />
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <CurrencySelector size="sm" className="w-14 text-xs" />
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          step="10"
                          value={getEffectiveBetAmount()}
                          onChange={(e) => setBetAmount(Number(e.target.value))}
                          className="form-input text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                    {tab === 'parlay' 
                      ? t('betting.la_quiniela_fixed_amount')
                      : t('betting.bet_amount_range')
                    }
                  </p>
                </div>
                {/* Potential Winnings */}
                <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-success-700 dark:text-success-300 font-medium">{t('betting.potential_winnings')}</span>
                    <span className="text-success-700 dark:text-success-300 font-bold text-lg">
                      <FormattedAmount amount={calculatePotentialWinnings()} />
                    </span>
                  </div>
                </div>
                {/* Submit Button */}
                <button
                  onClick={handleSubmitParlay}
                  disabled={Object.keys(predictions).length !== games.length || submitting || getEffectiveBetAmount() < 10}
                  className={`btn-primary w-full ${Object.keys(predictions).length !== games.length || submitting || getEffectiveBetAmount() < 10 ? 'btn-disabled' : ''}`}
                >
                  {submitting ? (
                    <div className="flex items-center"><div className="spinner-sm mr-2"></div>{t('common.loading')}</div>
                  ) : (
                    t('betting.confirm_bet')
                  )}
                </button>
                {Object.keys(predictions).length !== games.length && (
                  <p className="mt-2 text-xs text-warning-600 dark:text-warning-400 text-center">{t('betting.select_all_games')}</p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </ProtectedRoute>
    </Layout>
  );
}