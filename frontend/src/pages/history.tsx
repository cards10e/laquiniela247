import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useCurrency, Currency } from '@/context/CurrencyContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRestrictedRoute } from '@/components/auth/AdminRestrictedRoute';
import TeamLogo from '@/components/TeamLogo';
import { useFilteredBets, BetHistory, FilterType, BetTypeFilter } from '@/hooks/useFilteredBets';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faTrophy, 
  faChevronDown,
  faChevronUp,
  faStar,
  faFire,
  faFlag,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';

// BetHistory, FilterType, and BetTypeFilter interfaces moved to useFilteredBets hook

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
          setFormattedValue(`$${amount.toFixed(2)}`);
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

export default function HistoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { formatAmount } = useCurrency();
  const [bets, setBets] = useState<BetHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [betTypeFilter, setBetTypeFilter] = useState<BetTypeFilter>('all_types');
  const [expandedBet, setExpandedBet] = useState<number | null>(null);

  // Use optimized filtering hook with debouncing and memoization
  const { filteredBets, isFiltering } = useFilteredBets(bets, statusFilter, betTypeFilter);

  useEffect(() => {
    fetchBettingHistory();
  }, []);

  const fetchBettingHistory = async () => {
    try {
      const response = await axios.get('/api/bets/history');
      
      console.log('[DEBUG] API Response:', response.data);
      console.log('[DEBUG] Response data type:', typeof response.data);
      console.log('[DEBUG] Response data length:', Array.isArray(response.data) ? response.data.length : 'not array');
      
      // Check if user is demo user or if there's no real data
      const isDemoUser = user?.email === 'demo@laquiniela247.mx';
      const hasNoData = !response.data || (Array.isArray(response.data) && response.data.length === 0);
      
      if (isDemoUser || hasNoData) {
        console.log('Using enhanced demo data - Demo user:', isDemoUser, 'No data:', hasNoData);
        setBets([
          // La Quiniela Bets
          {
            id: 1,
            betType: 'la_quiniela',
            weekNumber: 28,
            amount: 200,
            status: 'won',
            correctPredictions: 10,
            totalPredictions: 10,
            winnings: 2000,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            predictions: [
              {
                gameId: 1,
                homeTeamName: 'América',
                awayTeamName: 'Chivas',
                prediction: 'home',
                result: 'home',
                correct: true
              },
              {
                gameId: 2,
                homeTeamName: 'Cruz Azul',
                awayTeamName: 'Pumas',
                prediction: 'away',
                result: 'away',
                correct: true
              },
              {
                gameId: 3,
                homeTeamName: 'Tigres UANL',
                awayTeamName: 'Monterrey',
                prediction: 'home',
                result: 'home',
                correct: true
              },
              {
                gameId: 4,
                homeTeamName: 'León',
                awayTeamName: 'Santos Laguna',
                prediction: 'draw',
                result: 'draw',
                correct: true
              },
              {
                gameId: 5,
                homeTeamName: 'Toluca',
                awayTeamName: 'Atlas',
                prediction: 'home',
                result: 'home',
                correct: true
              },
              {
                gameId: 6,
                homeTeamName: 'Pachuca',
                awayTeamName: 'Necaxa',
                prediction: 'away',
                result: 'away',
                correct: true
              },
              {
                gameId: 7,
                homeTeamName: 'Atlético San Luis',
                awayTeamName: 'FC Juárez',
                prediction: 'draw',
                result: 'draw',
                correct: true
              },
              {
                gameId: 8,
                homeTeamName: 'Querétaro',
                awayTeamName: 'Mazatlán',
                prediction: 'away',
                result: 'away',
                correct: true
              },
              {
                gameId: 9,
                homeTeamName: 'Tijuana',
                awayTeamName: 'Puebla',
                prediction: 'home',
                result: 'home',
                correct: true
              },
              {
                gameId: 10,
                homeTeamName: 'Guadalajara',
                awayTeamName: 'Atlas',
                prediction: 'draw',
                result: 'draw',
                correct: true
              }
            ]
          },
          {
            id: 2,
            betType: 'la_quiniela',
            weekNumber: 27,
            amount: 200,
            status: 'lost',
            correctPredictions: 6,
            totalPredictions: 10,
            winnings: 0,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            predictions: [
              {
                gameId: 11,
                homeTeamName: 'América',
                awayTeamName: 'Cruz Azul',
                prediction: 'home',
                result: 'away',
                correct: false
              },
              {
                gameId: 12,
                homeTeamName: 'Chivas',
                awayTeamName: 'Pumas',
                prediction: 'draw',
                result: 'home',
                correct: false
              },
              {
                gameId: 13,
                homeTeamName: 'Tigres UANL',
                awayTeamName: 'León',
                prediction: 'home',
                result: 'home',
                correct: true
              },
              {
                gameId: 14,
                homeTeamName: 'Santos Laguna',
                awayTeamName: 'Toluca',
                prediction: 'away',
                result: 'away',
                correct: true
              },
              {
                gameId: 15,
                homeTeamName: 'Atlas',
                awayTeamName: 'Pachuca',
                prediction: 'draw',
                result: 'draw',
                correct: true
              },
              {
                gameId: 16,
                homeTeamName: 'Necaxa',
                awayTeamName: 'Atlético San Luis',
                prediction: 'home',
                result: 'home',
                correct: true
              },
              {
                gameId: 17,
                homeTeamName: 'FC Juárez',
                awayTeamName: 'Querétaro',
                prediction: 'away',
                result: 'draw',
                correct: false
              },
              {
                gameId: 18,
                homeTeamName: 'Mazatlán',
                awayTeamName: 'Tijuana',
                prediction: 'home',
                result: 'away',
                correct: false
              },
              {
                gameId: 19,
                homeTeamName: 'Puebla',
                awayTeamName: 'Guadalajara',
                prediction: 'draw',
                result: 'draw',
                correct: true
              },
              {
                gameId: 20,
                homeTeamName: 'Monterrey',
                awayTeamName: 'Atlas',
                prediction: 'home',
                result: 'home',
                correct: true
              }
            ]
          },
          {
            id: 3,
            betType: 'la_quiniela',
            weekNumber: 29,
            amount: 200,
            status: 'pending',
            correctPredictions: 0,
            totalPredictions: 10,
            winnings: 0,
            date: new Date().toISOString(),
            predictions: [
              {
                gameId: 21,
                homeTeamName: 'Club América',
                awayTeamName: 'Club Necaxa',
                prediction: 'home',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 22,
                homeTeamName: 'Tijuana',
                awayTeamName: 'León FC',
                prediction: 'away',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 23,
                homeTeamName: 'Guadalajara',
                awayTeamName: 'Cruz Azul',
                prediction: 'draw',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 24,
                homeTeamName: 'Pumas',
                awayTeamName: 'Santos Laguna',
                prediction: 'home',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 25,
                homeTeamName: 'Toluca',
                awayTeamName: 'Tigres UANL',
                prediction: 'away',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 26,
                homeTeamName: 'Atlas',
                awayTeamName: 'Monterrey',
                prediction: 'draw',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 27,
                homeTeamName: 'Pachuca',
                awayTeamName: 'Atlético San Luis',
                prediction: 'home',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 28,
                homeTeamName: 'FC Juárez',
                awayTeamName: 'Mazatlán',
                prediction: 'away',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 29,
                homeTeamName: 'Querétaro',
                awayTeamName: 'Puebla',
                prediction: 'home',
                result: undefined,
                correct: undefined
              },
              {
                gameId: 30,
                homeTeamName: 'Necaxa',
                awayTeamName: 'Guadalajara',
                prediction: 'draw',
                result: undefined,
                correct: undefined
              }
            ]
          },
          // Single Bets
          {
            id: 4,
            betType: 'single_bet',
            gameId: 31,
            amount: 150,
            status: 'won',
            correctPredictions: 1,
            totalPredictions: 1,
            winnings: 285,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            predictions: [
              {
                gameId: 31,
                homeTeamName: 'América',
                awayTeamName: 'Chivas',
                prediction: 'home',
                result: 'home',
                correct: true
              }
            ]
          },
          {
            id: 5,
            betType: 'single_bet',
            gameId: 32,
            amount: 75,
            status: 'lost',
            correctPredictions: 0,
            totalPredictions: 1,
            winnings: 0,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            predictions: [
              {
                gameId: 32,
                homeTeamName: 'Cruz Azul',
                awayTeamName: 'Pumas',
                prediction: 'away',
                result: 'home',
                correct: false
              }
            ]
          },
          {
            id: 6,
            betType: 'single_bet',
            gameId: 33,
            amount: 300,
            status: 'won',
            correctPredictions: 1,
            totalPredictions: 1,
            winnings: 510,
            date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            predictions: [
              {
                gameId: 33,
                homeTeamName: 'Tigres UANL',
                awayTeamName: 'Monterrey',
                prediction: 'draw',
                result: 'draw',
                correct: true
              }
            ]
          },
          {
            id: 7,
            betType: 'single_bet',
            gameId: 34,
            amount: 50,
            status: 'pending',
            correctPredictions: 0,
            totalPredictions: 1,
            winnings: 0,
            date: new Date().toISOString(),
            predictions: [
              {
                gameId: 34,
                homeTeamName: 'León',
                awayTeamName: 'Santos Laguna',
                prediction: 'home',
                result: undefined,
                correct: undefined
              }
            ]
          }
        ]);
      } else {
        setBets(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch betting history:', error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  // filterBets function removed - now handled by useFilteredBets hook with optimization

  const formatPercentage = (correct: number, total: number) => {
    if (total === 0) return '0%';
    return `${((correct / total) * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'partial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'won':
        return t('history.won');
      case 'lost':
        return t('history.lost');
      case 'pending':
        return t('history.pending');
      case 'partial':
        return t('history.partial');
      default:
        return status;
    }
  };

  const getPerformanceBadge = (correct: number, total: number, betType: string) => {
    if (total === 0 || correct === 0) return null;
    
    const percentage = (correct / total) * 100;
    
    if (betType === 'la_quiniela') {
      if (percentage === 100) {
        return { text: t('history.perfect_week'), color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white', icon: faTrophy };
      } else if (percentage >= 80) {
        return { text: t('history.great_week'), color: 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white', icon: faStar };
      } else if (percentage >= 60) {
        return { text: t('history.good_week'), color: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white', icon: faFlag };
      } else {
        return { text: t('history.needs_improvement'), color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white', icon: faFire };
      }
    } else {
      return percentage === 100 
        ? { text: t('history.won'), color: 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white', icon: faTrophy }
        : null;
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'home':
        return '🏠';
      case 'away':
        return '✈️';
      case 'draw':
        return '🤝';
      default:
        return prediction;
    }
  };

  const getPredictionText = (prediction: string) => {
    switch (prediction) {
      case 'home':
        return t('betting.home_team');
      case 'away':
        return t('betting.away_team');
      case 'draw':
        return t('betting.draw');
      default:
        return prediction;
    }
  };

  if (loading) {
    return (
      <Layout title={t('history.title')}>
        <ProtectedRoute>
          <AdminRestrictedRoute>
            <div className="flex items-center justify-center min-h-96">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="text-lg text-secondary-600 dark:text-secondary-400">{t('common.loading')}</span>
              </div>
            </div>
          </AdminRestrictedRoute>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout title={t('history.title')}>
      <ProtectedRoute>
        <AdminRestrictedRoute>
          <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="page-title">
                {t('history.title')}
              </h1>
              
              <h2 className="section-title">
                {t(`history.betting_performance_and_history_${betTypeFilter}`)}
              </h2>
            </div>

            {/* Summary Stats */}
            {filteredBets.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                  <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    {t('history.total_bets')}
                  </div>
                  <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {filteredBets.length}
                  </div>
                </div>
                
                <div className="card text-center">
                  <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    {t('history.total_wagered')}
                  </div>
                  <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    <FormattedAmount amount={filteredBets.reduce((sum, bet) => sum + bet.amount, 0)} />
                  </div>
                </div>
                
                <div className="card text-center">
                  <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                    {t('history.total_winnings')}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    <FormattedAmount amount={filteredBets.reduce((sum, bet) => sum + bet.winnings, 0)} />
                  </div>
                </div>
              </div>
            )}

              {/* Consolidated Filter Tabs */}
              <div className="flex mb-8 border-b-2 border-secondary-200 dark:border-secondary-700">
                {(['all_types', 'la_quiniela', 'single_bets'] as BetTypeFilter[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setBetTypeFilter(type)}
                    className={`px-6 py-3 font-semibold focus:outline-none transition-colors ${
                      betTypeFilter === type 
                        ? 'border-b-4 border-primary-600 text-primary-700 dark:text-primary-300' 
                        : 'text-secondary-500 dark:text-secondary-400'
                    } ${type !== 'all_types' ? 'ml-2' : ''}`}
                  >
                    {t(`history.${type}`)}
                  </button>
                ))}
              </div>

            {/* Betting History Cards */}
            {filteredBets.length > 0 ? (
              <div className="space-y-4">
                {filteredBets.map((bet) => (
                  <div 
                    key={bet.id} 
                    className="bg-white dark:bg-secondary-800 rounded-xl shadow-md border border-secondary-200 dark:border-secondary-700 overflow-hidden"
                  >
                    {/* Mobile-First Compact Header - Always Visible */}
                    <div 
                      className="cursor-pointer p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors"
                      onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left: Title + Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-medium text-secondary-900 dark:text-secondary-100 truncate">
                              {bet.betType === 'la_quiniela' 
                                ? `${t('history.la_quiniela')} - ${t('dashboard.week')} ${bet.weekNumber}`
                                : t('history.single_bets')
                              }
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(bet.status)}`}>
                              {getStatusText(bet.status)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-secondary-600 dark:text-secondary-400">
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                              <span>{new Date(bet.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{t('history.accuracy')}: {bet.correctPredictions}/{bet.totalPredictions}</span>
                              <span className="text-secondary-500">
                                ({formatPercentage(bet.correctPredictions, bet.totalPredictions)})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Winnings + Expand Button */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-0.5">
                              {t('history.winnings')}
                            </div>
                            <div className={`text-sm font-medium ${
                              bet.winnings > 0 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-secondary-600 dark:text-secondary-400'
                            }`}>
                              <FormattedAmount amount={bet.winnings} />
                            </div>
                          </div>
                          
                          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors flex-shrink-0">
                            <FontAwesomeIcon 
                              icon={expandedBet === bet.id ? faChevronUp : faChevronDown} 
                              className="w-3 h-3"
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    {expandedBet === bet.id && (
                      <div className="border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/30">
                        {/* Detailed Stats Section */}
                        <div className="p-4 grid grid-cols-3 gap-4 text-center border-b border-secondary-200 dark:border-secondary-700">
                          <div>
                            <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                              {t('history.entry_fee')}
                            </div>
                            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                              <FormattedAmount amount={bet.amount} />
                            </div>
                          </div>
                          
                                                     <div>
                             <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                               {t('history.predictions_detail')}
                             </div>
                             <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                               {bet.betType === 'la_quiniela' 
                                 ? t('history.predictions_count', { count: bet.totalPredictions })
                                 : t('history.single_prediction')
                               }
                             </div>
                           </div>

                          <div>
                            <div className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                              {t('history.performance_badge')}
                            </div>
                            <div className="flex justify-center">
                              {(() => {
                                const badge = getPerformanceBadge(bet.correctPredictions, bet.totalPredictions, bet.betType);
                                return badge ? (
                                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                    <FontAwesomeIcon icon={badge.icon} className="w-3 h-3" />
                                    <span>{badge.text}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-secondary-500">-</span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Predictions Details */}
                        {bet.predictions.length > 0 && (
                          <div className="p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                              <FontAwesomeIcon icon={faFlag} className="text-primary-600 w-3 h-3" />
                              <span>{t('history.bet_details')}</span>
                            </h4>
                            
                            <div className="space-y-3">
                              {bet.predictions.map((prediction) => (
                                <div 
                                  key={prediction.gameId}
                                  className={`p-3 rounded-lg border transition-all duration-200 ${
                                    prediction.correct === true
                                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'
                                      : prediction.correct === false
                                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                                      : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    {/* Teams */}
                                    <div className="flex items-center gap-2 text-sm font-medium text-secondary-900 dark:text-secondary-100 flex-1 min-w-0">
                                      <TeamLogo teamName={prediction.homeTeamName} className="w-5 h-5 flex-shrink-0" alt={prediction.homeTeamName} />
                                      <span className="truncate max-w-[60px]">{prediction.homeTeamName}</span>
                                      <span className="text-secondary-500 mx-1">{t('admin.vs')}</span>
                                      <span className="truncate max-w-[60px]">{prediction.awayTeamName}</span>
                                      <TeamLogo teamName={prediction.awayTeamName} className="w-5 h-5 flex-shrink-0" alt={prediction.awayTeamName} />
                                    </div>
                                    
                                    {/* Result indicator */}
                                    {prediction.correct !== undefined && (
                                      <div className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                                        prediction.correct 
                                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                      }`}>
                                        <span className="text-sm font-bold">
                                          {prediction.correct ? '✓' : '✗'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Prediction vs Result */}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-secondary-600 dark:text-secondary-400">
                                        {t('history.your_prediction')}:
                                      </span>
                                      <span className="font-medium text-secondary-900 dark:text-secondary-100">
                                        {getPredictionIcon(prediction.prediction)} {getPredictionText(prediction.prediction)}
                                      </span>
                                    </div>
                                    
                                    {prediction.result && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-secondary-600 dark:text-secondary-400">
                                          {t('history.actual_result')}:
                                        </span>
                                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                                          {getPredictionIcon(prediction.result)} {getPredictionText(prediction.result)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="text-secondary-400 dark:text-secondary-500 text-4xl mb-4">📊</div>
                <h2 className="subsection-title">
                  {statusFilter === 'all' && betTypeFilter === 'all_types'
                    ? t('history.no_bets_yet')
                    : t('history.no_results_found')
                  }
                </h2>
                <p className="text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
                  {statusFilter === 'all' && betTypeFilter === 'all_types'
                    ? t('history.start_betting_message')
                    : t('history.try_different_filter')
                  }
                </p>
                {statusFilter === 'all' && betTypeFilter === 'all_types' && (
                  <a
                    href="/bet"
                    className="btn-primary"
                  >
                    {t('dashboard.place_first_bet')}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        </AdminRestrictedRoute>
      </ProtectedRoute>
    </Layout>
  );
}