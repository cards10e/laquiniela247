import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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
}

interface Week {
  id: number;
  weekNumber: number;
  status: 'open' | 'closed' | 'completed';
  bettingDeadline: string;
}

type PredictionType = 'home' | 'away' | 'draw';

interface Prediction {
  gameId: number;
  prediction: PredictionType;
}

export default function BetPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Record<number, PredictionType>>({});
  const [betAmount, setBetAmount] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBettingData();
  }, []);

  const fetchBettingData = async () => {
    try {
      const [weekRes, gamesRes] = await Promise.all([
        axios.get('/weeks/current'),
        axios.get('/games/current-week')
      ]);

      setCurrentWeek(weekRes.data);
      setGames(gamesRes.data);
    } catch (error) {
      console.error('Failed to fetch betting data:', error);
      // Set mock data for demo
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

  const calculatePotentialWinnings = () => {
    const numPredictions = Object.keys(predictions).length;
    if (numPredictions === 0) return 0;
    
    // Simple calculation: base amount * multiplier based on number of correct predictions
    const baseMultiplier = 1.5;
    const bonusMultiplier = numPredictions >= games.length ? 2.0 : 1.0;
    return betAmount * baseMultiplier * bonusMultiplier;
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

  const handleSubmitBet = async () => {
    if (Object.keys(predictions).length !== games.length) {
      toast.error(t('betting.select_all_games'));
      return;
    }

    if (betAmount < 10) {
      toast.error(t('betting.minimum_bet_amount'));
      return;
    }

    setSubmitting(true);

    try {
      const betData = {
        weekId: currentWeek?.id,
        amount: betAmount,
        predictions: Object.entries(predictions).map(([gameId, prediction]) => ({
          gameId: parseInt(gameId),
          prediction
        }))
      };

      await axios.post('/bets', betData);
      
      toast.success(t('betting.bet_placed'));
      // Reset form
      setPredictions({});
      setBetAmount(50);
    } catch (error: any) {
      console.error('Failed to place bet:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t('betting.bet_failed'));
      }
    } finally {
      setSubmitting(false);
    }
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

  if (!currentWeek || currentWeek.status !== 'open') {
    return (
      <Layout title={t('betting.place_bet')}>
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card text-center py-12">
              <div className="text-secondary-400 dark:text-secondary-500 text-4xl mb-4">⏰</div>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
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

  return (
    <Layout title={t('betting.place_bet')}>
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              {t('betting.place_bet')}
            </h1>
            
            {/* Week Info */}
            <div className="bg-primary-600 text-white rounded-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    {t('dashboard.week')} {currentWeek.weekNumber}
                  </h2>
                  <span className="inline-block bg-warning-600 text-secondary-900 px-3 py-1 rounded-full text-sm font-medium">
                    {t('dashboard.open_for_betting')}
                  </span>
                </div>
                
                <div className="mt-4 sm:mt-0 bg-secondary-900 text-white px-4 py-2 rounded-lg">
                  <div className="text-sm opacity-90">{t('dashboard.betting_closes_in')}</div>
                  <div className="font-bold text-lg">
                    {timeUntilDeadline(currentWeek.bettingDeadline)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Games List */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                {t('betting.select_predictions')}
              </h3>
              
              <div className="space-y-4">
                {games.map((game) => (
                  <div key={game.id} className="card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      {/* Teams */}
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="flex items-center space-x-2">
                          {game.homeTeamLogo && (
                            <img 
                              src={game.homeTeamLogo} 
                              alt={game.homeTeamName}
                              className="team-logo"
                            />
                          )}
                          <span className="font-medium text-secondary-900 dark:text-secondary-100">
                            {game.homeTeamName}
                          </span>
                        </div>
                        
                        <span className="text-secondary-500 dark:text-secondary-400 font-bold">VS</span>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-secondary-900 dark:text-secondary-100">
                            {game.awayTeamName}
                          </span>
                          {game.awayTeamLogo && (
                            <img 
                              src={game.awayTeamLogo} 
                              alt={game.awayTeamName}
                              className="team-logo"
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Game Date */}
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {new Date(game.gameDate).toLocaleDateString()} {new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    {/* Prediction Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handlePredictionChange(game.id, 'home')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                          predictions[game.id] === 'home'
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                        }`}
                      >
                        {t('betting.home_team')}
                        <div className="text-xs opacity-75 mt-1">{game.homeTeamName}</div>
                      </button>
                      
                      <button
                        onClick={() => handlePredictionChange(game.id, 'draw')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                          predictions[game.id] === 'draw'
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                        }`}
                      >
                        {t('betting.draw')}
                      </button>
                      
                      <button
                        onClick={() => handlePredictionChange(game.id, 'away')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                          predictions[game.id] === 'away'
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                        }`}
                      >
                        {t('betting.away_team')}
                        <div className="text-xs opacity-75 mt-1">{game.awayTeamName}</div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bet Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
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
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(Object.keys(predictions).length / games.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Bet Amount */}
                <div className="mb-6">
                  <label className="form-label">
                    {t('betting.bet_amount')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500 dark:text-secondary-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      step="10"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="form-input pl-8"
                    />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                    {t('betting.bet_amount_range')}
                  </p>
                </div>
                
                {/* Potential Winnings */}
                <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-success-700 dark:text-success-300 font-medium">
                      {t('betting.potential_winnings')}
                    </span>
                    <span className="text-success-700 dark:text-success-300 font-bold text-lg">
                      ${calculatePotentialWinnings().toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmitBet}
                  disabled={Object.keys(predictions).length !== games.length || submitting || betAmount < 10}
                  className={`btn-primary w-full ${
                    Object.keys(predictions).length !== games.length || submitting || betAmount < 10
                      ? 'btn-disabled'
                      : ''
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="spinner-sm mr-2"></div>
                      {t('common.loading')}
                    </div>
                  ) : (
                    t('betting.confirm_bet')
                  )}
                </button>
                
                {Object.keys(predictions).length !== games.length && (
                  <p className="mt-2 text-xs text-warning-600 dark:text-warning-400 text-center">
                    {t('betting.select_all_games')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </Layout>
  );
}