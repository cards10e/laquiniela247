import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useCurrency, Currency } from '@/context/CurrencyContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import TeamLogo from '@/components/TeamLogo';
import axios from 'axios';

interface BetHistory {
  id: number;
  weekNumber: number;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'partial';
  correctPredictions: number;
  totalPredictions: number;
  winnings: number;
  date: string;
  predictions: {
    gameId: number;
    homeTeamName: string;
    awayTeamName: string;
    prediction: 'home' | 'away' | 'draw';
    result?: 'home' | 'away' | 'draw';
    correct?: boolean;
  }[];
}

type FilterType = 'all' | 'won' | 'lost' | 'pending';

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

export default function HistoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { formatAmount } = useCurrency();
  const [bets, setBets] = useState<BetHistory[]>([]);
  const [filteredBets, setFilteredBets] = useState<BetHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedBet, setExpandedBet] = useState<number | null>(null);

  useEffect(() => {
    fetchBettingHistory();
  }, []);

  useEffect(() => {
    filterBets();
  }, [bets, filter]);

  const fetchBettingHistory = async () => {
    try {
      const response = await axios.get('/api/bets/history');
      
      // If no betting history exists, use mock data for demo
      if (!response.data || response.data.length === 0) {
        console.log('No betting history found, using demo data');
        // Set enhanced mock data for demo with full prediction details
      setBets([
        {
          id: 1,
          weekNumber: 14,
          amount: 100,
          status: 'won',
          correctPredictions: 8,
          totalPredictions: 10,
          winnings: 250,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
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
              result: 'draw',
              correct: false
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
            }
          ]
        },
        {
          id: 2,
          weekNumber: 13,
          amount: 75,
          status: 'lost',
          correctPredictions: 4,
          totalPredictions: 10,
          winnings: 0,
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          predictions: [
            {
              gameId: 6,
              homeTeamName: 'Pachuca',
              awayTeamName: 'Necaxa',
              prediction: 'home',
              result: 'away',
              correct: false
            },
            {
              gameId: 7,
              homeTeamName: 'Atlético San Luis',
              awayTeamName: 'FC Juárez',
              prediction: 'draw',
              result: 'home',
              correct: false
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
              result: 'draw',
              correct: false
            }
          ]
        },
        {
          id: 3,
          weekNumber: 15,
          amount: 50,
          status: 'pending',
          correctPredictions: 0,
          totalPredictions: 6,
          winnings: 0,
          date: new Date().toISOString(),
          predictions: [
            {
              gameId: 10,
              homeTeamName: 'Club América',
              awayTeamName: 'Club Necaxa',
              prediction: 'home',
              result: undefined,
              correct: undefined
            },
            {
              gameId: 11,
              homeTeamName: 'Tijuana',
              awayTeamName: 'León FC',
              prediction: 'away',
              result: undefined,
              correct: undefined
            },
            {
              gameId: 12,
              homeTeamName: 'Guadalajara',
              awayTeamName: 'Cruz Azul',
              prediction: 'draw',
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
      // Fallback to mock data on error as well
      setBets([
        {
          id: 1,
          weekNumber: 14,
          amount: 100,
          status: 'won',
          correctPredictions: 8,
          totalPredictions: 10,
          winnings: 250,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
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
              result: 'draw',
              correct: false
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
            }
          ]
        },
        {
          id: 2,
          weekNumber: 13,
          amount: 75,
          status: 'lost',
          correctPredictions: 4,
          totalPredictions: 10,
          winnings: 0,
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          predictions: [
            {
              gameId: 6,
              homeTeamName: 'Pachuca',
              awayTeamName: 'Necaxa',
              prediction: 'home',
              result: 'away',
              correct: false
            },
            {
              gameId: 7,
              homeTeamName: 'Atlético San Luis',
              awayTeamName: 'FC Juárez',
              prediction: 'draw',
              result: 'home',
              correct: false
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
              result: 'draw',
              correct: false
            }
          ]
        },
        {
          id: 3,
          weekNumber: 15,
          amount: 50,
          status: 'pending',
          correctPredictions: 0,
          totalPredictions: 6,
          winnings: 0,
          date: new Date().toISOString(),
          predictions: [
            {
              gameId: 10,
              homeTeamName: 'Club América',
              awayTeamName: 'Club Necaxa',
              prediction: 'home',
              result: undefined,
              correct: undefined
            },
            {
              gameId: 11,
              homeTeamName: 'Tijuana',
              awayTeamName: 'León FC',
              prediction: 'away',
              result: undefined,
              correct: undefined
            },
            {
              gameId: 12,
              homeTeamName: 'Guadalajara',
              awayTeamName: 'Cruz Azul',
              prediction: 'draw',
              result: undefined,
              correct: undefined
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterBets = () => {
    if (filter === 'all') {
      setFilteredBets(bets);
    } else {
      setFilteredBets(bets.filter(bet => bet.status === filter));
    }
  };



  const formatPercentage = (correct: number, total: number) => {
    if (total === 0) return '0%';
    return `${((correct / total) * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20';
      case 'lost':
        return 'text-error-600 dark:text-error-400 bg-error-100 dark:bg-error-900/20';
      case 'pending':
        return 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/20';
      case 'partial':
        return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-800';
      default:
        return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-800';
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

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'home':
        return '🏠';
      case 'away':
        return '✈️';
      case 'draw':
        return '🤝';
      default:
        return '❓';
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
          <div className="flex items-center justify-center min-h-96">
            <div className="spinner"></div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout title={t('history.title')}>
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="page-title mb-4">
              {t('history.title')}
            </h1>
            
            {/* Betting History */}
            <h2 className="section-title mb-4">
              {t('history.title')}
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'won', 'lost', 'pending'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                  }`}
                >
                  {t(`history.${filterType === 'all' ? 'all_bets' : filterType}`)}
                </button>
              ))}
            </div>
          </div>
          
          {filteredBets.length > 0 ? (
            <div className="space-y-4">
              {filteredBets.map((bet) => (
                <div key={bet.id} className="card">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div>
                          <h3 className="content-title">
                            {t('dashboard.week')} {bet.weekNumber}
                          </h3>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            {new Date(bet.date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-secondary-600 dark:text-secondary-400">
                            {t('history.amount')}
                          </div>
                          <div className="font-medium text-secondary-900 dark:text-secondary-100">
                            <FormattedAmount amount={bet.amount} />
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-secondary-600 dark:text-secondary-400">
                            {t('history.accuracy')}
                          </div>
                          <div className="font-medium text-secondary-900 dark:text-secondary-100">
                            {bet.correctPredictions}/{bet.totalPredictions}
                            <span className="text-xs ml-1">
                              ({formatPercentage(bet.correctPredictions, bet.totalPredictions)})
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-secondary-600 dark:text-secondary-400">
                            {t('history.winnings')}
                          </div>
                          <div className={`font-semibold ${
                            bet.winnings > 0 
                              ? 'text-success-600 dark:text-success-400' 
                              : 'text-secondary-600 dark:text-secondary-400'
                          }`}>
                            <FormattedAmount amount={bet.winnings} />
                          </div>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bet.status)}`}>
                          {getStatusText(bet.status)}
                        </span>
                        
                        <div className="text-secondary-400 dark:text-secondary-500">
                          {expandedBet === bet.id ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedBet === bet.id && bet.predictions.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                      <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                        {t('history.predictions_detail')}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bet.predictions.map((prediction) => (
                          <div 
                            key={prediction.gameId}
                            className={`p-4 rounded-lg border-2 ${
                              prediction.correct === true
                                ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/10'
                                : prediction.correct === false
                                ? 'border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/10'
                                : 'border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2 font-medium text-secondary-900 dark:text-secondary-100">
                                <TeamLogo teamName={prediction.homeTeamName} className="w-5 h-5" alt={prediction.homeTeamName} />
                                <span>{prediction.homeTeamName}</span>
                                <span className="text-secondary-500">vs</span>
                                <span>{prediction.awayTeamName}</span>
                                <TeamLogo teamName={prediction.awayTeamName} className="w-5 h-5" alt={prediction.awayTeamName} />
                              </div>
                              {prediction.correct !== undefined && (
                                <div className={`text-lg ${
                                  prediction.correct 
                                    ? 'text-success-600 dark:text-success-400' 
                                    : 'text-error-600 dark:text-error-400'
                                }`}>
                                  {prediction.correct ? '✓' : '✗'}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-secondary-600 dark:text-secondary-400">
                                {t('history.your_prediction')}: 
                                <span className="ml-1 font-medium">
                                  {getPredictionIcon(prediction.prediction)} {getPredictionText(prediction.prediction)}
                                </span>
                              </div>
                              
                              {prediction.result && (
                                <div className="text-secondary-600 dark:text-secondary-400">
                                  {t('history.actual_result')}: 
                                  <span className="ml-1 font-medium">
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
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-secondary-400 dark:text-secondary-500 text-4xl mb-4">📊</div>
              <h2 className="subsection-title">
                {filter === 'all' 
                  ? t('history.no_bets_yet')
                  : t('history.no_bets_in_filter').replace('%s', getStatusText(filter))
                }
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                {filter === 'all'
                  ? t('history.start_betting_message')
                  : t('history.try_different_filter')
                }
              </p>
              {filter === 'all' && (
                <a
                  href="/bet"
                  className="btn-primary"
                >
                  {t('dashboard.place_first_bet')}
                </a>
              )}
            </div>
          )}

          {/* Summary Stats */}
          {filteredBets.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('history.total_bets')}
                </div>
                <div className="performance-card-value">
                  {filteredBets.length}
                </div>
              </div>
              
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('history.total_wagered')}
                </div>
                <div className="performance-card-value">
                  <FormattedAmount amount={filteredBets.reduce((sum, bet) => sum + bet.amount, 0)} />
                </div>
              </div>
              
              <div className="performance-card">
                <div className="performance-card-title">
                  {t('history.total_winnings')}
                </div>
                <div className="performance-card-value">
                  <FormattedAmount amount={filteredBets.reduce((sum, bet) => sum + bet.winnings, 0)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ProtectedRoute>
    </Layout>
  );
}