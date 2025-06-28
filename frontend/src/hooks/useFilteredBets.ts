import { useState, useEffect, useMemo } from 'react';

export interface BetHistory {
  id: number;
  betType: 'la_quiniela' | 'single_bet';
  weekNumber?: number;
  gameId?: number;
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

export type FilterType = 'all' | 'won' | 'lost' | 'pending';
export type BetTypeFilter = 'all_types' | 'la_quiniela' | 'single_bets';

interface UseFilteredBetsOptions {
  debounceMs?: number;
}

interface UseFilteredBetsReturn {
  filteredBets: BetHistory[];
  isFiltering: boolean;
}

/**
 * Custom hook for filtering betting history with debouncing and memoization
 * Optimizes performance by debouncing filter changes and memoizing results
 */
export const useFilteredBets = (
  bets: BetHistory[],
  statusFilter: FilterType,
  betTypeFilter: BetTypeFilter,
  options: UseFilteredBetsOptions = {}
): UseFilteredBetsReturn => {
  const { debounceMs = 300 } = options;
  
  // Debounced filter states
  const [debouncedStatusFilter, setDebouncedStatusFilter] = useState(statusFilter);
  const [debouncedBetTypeFilter, setDebouncedBetTypeFilter] = useState(betTypeFilter);
  const [isFiltering, setIsFiltering] = useState(false);

  // Debounce status filter changes
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setDebouncedStatusFilter(statusFilter);
      setIsFiltering(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [statusFilter, debounceMs]);

  // Debounce bet type filter changes
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setDebouncedBetTypeFilter(betTypeFilter);
      setIsFiltering(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [betTypeFilter, debounceMs]);

  // Memoized filtering logic - same as original but optimized
  const filteredBets = useMemo(() => {
    let filtered = bets;

    // Filter by bet type (exact same logic as original)
    if (debouncedBetTypeFilter !== 'all_types') {
      filtered = filtered.filter(bet => 
        debouncedBetTypeFilter === 'la_quiniela' ? bet.betType === 'la_quiniela' : bet.betType === 'single_bet'
      );
    }

    // Filter by status (exact same logic as original)
    if (debouncedStatusFilter !== 'all') {
      filtered = filtered.filter(bet => bet.status === debouncedStatusFilter);
    }

    return filtered;
  }, [bets, debouncedStatusFilter, debouncedBetTypeFilter]);

  return {
    filteredBets,
    isFiltering
  };
}; 