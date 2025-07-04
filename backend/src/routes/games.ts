import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Helper function to compute automatic game status based on match time
const computeAutoGameStatus = (game: any) => {
  const now = new Date();
  const gameDate = new Date(game.matchDate);
  const minutesUntilGame = (gameDate.getTime() - now.getTime()) / (1000 * 60);
  const minutesSinceGameStart = (now.getTime() - gameDate.getTime()) / (1000 * 60);
  
  // If game ended more than 150 minutes ago (2.5 hours), it should be finished
  if (minutesSinceGameStart > 150) {
    return 'FINISHED';
  }
  
  // If game started (within 150 minutes), it should be live
  if (minutesSinceGameStart >= 0 && minutesSinceGameStart <= 150) {
    return 'LIVE';
  }
  
  // If game hasn't started yet, it's scheduled
  if (minutesUntilGame > 0) {
    return 'SCHEDULED';
  }
  
  return game.status || 'SCHEDULED';
};

// Validation schemas
const getGamesSchema = z.object({
  week: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'finished']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

// GET /api/games - Get games with optional filters
router.get('/', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const query = getGamesSchema.parse(req.query);
  
  const limit = query.limit ? parseInt(query.limit) : 20;
  const offset = query.offset ? parseInt(query.offset) : 0;
  
  const where: any = {};
  
  if (query.week) {
    where.weekNumber = parseInt(query.week);
  }
  
  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  const games = await prisma.game.findMany({
    where,
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      },
      week: {
        select: {
          id: true,
          weekNumber: true,
          season: true,
          bettingDeadline: true,
          status: true
        }
      },
      _count: {
        select: {
          bets: true
        }
      }
    },
    orderBy: {
      matchDate: 'asc'
    },
    take: limit,
    skip: offset
  });

  // If user is authenticated, include their bets
  let gamesWithUserBets = games;
  if (req.user) {
    const userBets = await prisma.bet.findMany({
      where: {
        userId: req.user.id,
        gameId: {
          in: games.map(game => game.id)
        }
      }
    });

    const betsByGameId = userBets.reduce((acc, bet) => {
      acc[bet.gameId] = bet;
      return acc;
    }, {} as Record<number, any>);

    console.log('[DEBUG] betsByGameId lookup:', betsByGameId);
    
    gamesWithUserBets = games.map(game => {
      const bet = betsByGameId[game.id];
      console.log(`[DEBUG] Game ${game.id}: bet found:`, !!bet, 'prediction:', bet?.prediction);
      return {
        ...game,
        userBet: bet && bet.prediction ? bet : null
      };
    });
  }

  res.json({
    games: gamesWithUserBets,
    pagination: {
      limit,
      offset,
      total: await prisma.game.count({ where })
    }
  });
}));

// GET /api/games/current-week - Get all open weeks' games
router.get('/current-week', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const now = new Date();
  console.log('[DEBUG] /api/games/current-week called at', now.toISOString());
  
  // USER FILTERING: All users (except admins) only see current betting week
  // Admins see all open weeks for management purposes
  const isAdmin = req.user?.role === 'ADMIN';
  const shouldFilterToCurrentWeek = req.user && !isAdmin;
  
  let openWeeks;
  if (shouldFilterToCurrentWeek) {
    // Regular users: Only show the most current week with valid betting deadline
    openWeeks = await prisma.week.findMany({
      where: {
        status: 'OPEN',
        bettingDeadline: {
          gt: now // Only weeks with future deadlines
        }
      },
      orderBy: [
        { bettingDeadline: 'asc' }, // Earliest deadline first (most urgent)
        { weekNumber: 'desc' }
      ],
      take: 1 // Only the most current/urgent week
    });
    console.log('[DEBUG] Regular user - filtered to current week only:', openWeeks.map(w => w.weekNumber));
  } else {
    // Admins and unauthenticated users: Show ALL open weeks (existing behavior)
    openWeeks = await prisma.week.findMany({
      where: {
        status: 'OPEN'
        // Removed bettingDeadline filter - admin-opened weeks show regardless of deadline
      },
      orderBy: [
        { startDate: 'desc' },
        { weekNumber: 'desc' }
      ]
    });
    console.log('[DEBUG] Admin or unauthenticated - showing all open weeks:', openWeeks.map(w => w.weekNumber));
  }
  
  if (openWeeks.length === 0) {
    console.log('[DEBUG] No active betting weeks found');
    throw createError('No active betting weeks found', 404);
  }
  
  console.log('[DEBUG] Found open weeks:', openWeeks.map(w => ({
    weekNumber: w.weekNumber,
    status: w.status,
    bettingDeadline: w.bettingDeadline
  })));
  
  // Get games from open weeks + existing bet weeks for demo users
  let weekNumbers = openWeeks.map(w => w.weekNumber);
  
  // REGULAR USER EXCEPTION: Include games from weeks with existing bets
  if (shouldFilterToCurrentWeek) {
    const existingBetGames = await prisma.bet.findMany({
      where: {
        userId: req.user!.id // Safe to use ! since shouldFilterToCurrentWeek ensures req.user exists
      },
      include: {
        game: {
          select: {
            weekNumber: true
          }
        }
      }
    });
    
    const existingGameWeeks = existingBetGames.map(b => b.game.weekNumber);
    weekNumbers = [...new Set([...weekNumbers, ...existingGameWeeks])]; // Merge and deduplicate
    console.log('[DEBUG] Regular user - including games from weeks:', weekNumbers);
  }
  
  const games = await prisma.game.findMany({
    where: {
      weekNumber: {
        in: weekNumbers
      }
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      },
      _count: {
        select: {
          bets: true
        }
      }
    },
    orderBy: {
      matchDate: 'asc'
    }
  });
  console.log('[DEBUG] Found games:', games.length);
  
  // Auto-update game statuses based on time before sending response
  const gamesToUpdate = [];
  for (const game of games) {
    const autoStatus = computeAutoGameStatus(game);
    if (autoStatus !== game.status) {
      gamesToUpdate.push({ id: game.id, newStatus: autoStatus });
    }
  }

  let updatedGames = games;

  // Batch update games that need status changes
  if (gamesToUpdate.length > 0) {
    await Promise.all(
      gamesToUpdate.map(({ id, newStatus }) =>
        prisma.game.update({
          where: { id },
          data: { status: newStatus }
        })
      )
    );
    
    // Refetch games with updated statuses (using same weekNumbers logic)
    updatedGames = await prisma.game.findMany({
      where: {
        weekNumber: {
          in: weekNumbers
        }
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true
          }
        },
        _count: {
          select: {
            bets: true
          }
        }
      },
      orderBy: {
        matchDate: 'asc'
      }
    });
  }
  
  // Create week lookup for deadlines (used for both authenticated and non-authenticated users)
  const weekDeadlineMap = openWeeks.reduce((acc, week) => {
    acc[week.weekNumber] = week.bettingDeadline.toISOString();
    return acc;
  }, {} as Record<number, string>);
  
  // If user is authenticated, include their bets for ALL open weeks
  let gamesWithUserBets = updatedGames.map(game => ({
    ...game,
    bettingDeadline: weekDeadlineMap[game.weekNumber] // CRITICAL FIX: Include week deadline for each game
  }));
  const betType = req.query.betType as string; // Get betType from query parameter - moved to higher scope
  if (req.user) {
    // DEMO USER EXCEPTION: Include existing bets from previous weeks
    // Even though we only show current week games, we need to show existing bets
    let weekIds = openWeeks.map(w => w.id);
    
    if (shouldFilterToCurrentWeek) {
      // For regular users, also include weeks where they have existing bets
      const existingBetWeeks = await prisma.bet.findMany({
        where: {
          userId: req.user.id
        },
        select: {
          weekId: true
        },
        distinct: ['weekId']
      });
      
      const existingWeekIds = existingBetWeeks.map(b => b.weekId);
      weekIds = [...new Set([...weekIds, ...existingWeekIds])]; // Merge and deduplicate
      console.log('[DEBUG] Regular user - including existing bet weeks:', existingWeekIds);
    }
    
    const betFilter: any = {
      userId: req.user.id,
      weekId: {
        in: weekIds
      }
    };
    
    // Filter by betType if specified (for separating single vs parlay bets)
    if (betType && (betType === 'single' || betType === 'parlay')) {
      // Convert to uppercase enum values that Prisma expects
      betFilter.betType = betType.toUpperCase();
    }
    
    console.log('[DEBUG] Fetching user bets with filter:', betFilter);
    const userBets = await prisma.bet.findMany({
      where: betFilter
    });
    console.log('[DEBUG] Found user bets:', userBets.length, userBets.map(b => ({ gameId: b.gameId, prediction: b.prediction, betType: b.betType })));

    const betsByGameId = userBets.reduce((acc, bet) => {
      acc[bet.gameId] = bet;
      return acc;
    }, {} as Record<number, any>);
    
    console.log('[DEBUG] betsByGameId lookup:', betsByGameId);
    
    gamesWithUserBets = gamesWithUserBets.map(game => {
      const bet = betsByGameId[game.id];
      console.log(`[DEBUG] Game ${game.id}: bet found:`, !!bet, 'prediction:', bet?.prediction);
      return {
        ...game,
        userBet: bet ? bet : null  // SIMPLIFY: Remove prediction check
      };
    });
  }
  
  // Return data with primary week - choose the most appropriate week for betting
  // (reusing 'now' variable already declared at function start)
  
  // First, try to find weeks with valid (non-expired) deadlines
  const validWeeks = openWeeks.filter(w => new Date(w.bettingDeadline) > now);
  
  let primaryWeek;
  if (validWeeks.length > 0) {
    // If there are valid weeks, pick the one with the earliest deadline (most urgent)
    primaryWeek = validWeeks.reduce((earliest, current) => 
      new Date(current.bettingDeadline) < new Date(earliest.bettingDeadline) ? current : earliest
    );
  } else {
    // If all deadlines have passed, pick the most recently opened week (highest week number)
    primaryWeek = openWeeks.reduce((latest, current) => 
      current.weekNumber > latest.weekNumber ? current : latest
    );
  }
  
  // Calculate betStatus for the primary week
  let betStatus = {
    canBet: openWeeks.some(w => w.status === 'OPEN' && new Date() < w.bettingDeadline),
    hasPlacedAllBets: false,
    placedBetsCount: 0,
    totalGamesCount: 0
  };

  if (req.user && primaryWeek) {
    const totalGamesInPrimaryWeek = await prisma.game.count({
      where: { weekNumber: primaryWeek.weekNumber }
    });
    
    // Filter bet counting by betType to match the request filter
    const userBetFilter: any = {
      userId: req.user.id,
      weekId: primaryWeek.id
    };
    
    // Apply same betType filter as above for consistency
    if (betType && (betType === 'single' || betType === 'parlay')) {
      userBetFilter.betType = betType.toUpperCase();
    }
    
    const userBetsInPrimaryWeek = await prisma.bet.count({
      where: userBetFilter
    });

    betStatus = {
      canBet: betStatus.canBet,
      hasPlacedAllBets: userBetsInPrimaryWeek >= totalGamesInPrimaryWeek && totalGamesInPrimaryWeek > 0,
      placedBetsCount: userBetsInPrimaryWeek,
      totalGamesCount: totalGamesInPrimaryWeek
    };
  }

  res.json({
    week: primaryWeek,
    weeks: openWeeks, // Include all open weeks for frontend
    games: gamesWithUserBets,
    canBet: betStatus.canBet,
    betStatus
  });
}));

// GET /api/games/:id - Get specific game
router.get('/:id', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const gameId = parseInt(req.params.id);
  
  if (isNaN(gameId)) {
    throw createError('Invalid game ID', 400);
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: true,
      awayTeam: true,
      week: true,
      bets: req.user ? {
        where: {
          userId: req.user.id
        },
        select: {
          id: true,
          prediction: true,
          isCorrect: true,
          createdAt: true
        }
      } : false,
      _count: {
        select: {
          bets: true
        }
      }
    }
  });

  if (!game) {
    throw createError('Game not found', 404);
  }

  res.json({
    game: {
      ...game,
      userBet: req.user && game.bets && game.bets.length > 0 ? game.bets[0] : null,
      bets: undefined // Remove bets array from response
    }
  });
}));

// GET /api/games/week/:weekNumber - Get games for specific week
router.get('/week/:weekNumber', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const weekNumber = parseInt(req.params.weekNumber);
  
  if (isNaN(weekNumber)) {
    throw createError('Invalid week number', 400);
  }

  const week = await prisma.week.findUnique({
    where: { weekNumber }
  });

  if (!week) {
    throw createError('Week not found', 404);
  }

  const games = await prisma.game.findMany({
    where: {
      weekNumber
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      },
      _count: {
        select: {
          bets: true
        }
      }
    },
    orderBy: {
      matchDate: 'asc'
    }
  });

  // If user is authenticated, include their bets
  let gamesWithUserBets = games;
  if (req.user) {
    const userBets = await prisma.bet.findMany({
      where: {
        userId: req.user.id,
        weekId: week.id
      }
    });

    const betsByGameId = userBets.reduce((acc, bet) => {
      acc[bet.gameId] = bet;
      return acc;
    }, {} as Record<number, any>);

    console.log('[DEBUG] betsByGameId lookup:', betsByGameId);
    
    gamesWithUserBets = games.map(game => {
      const bet = betsByGameId[game.id];
      console.log(`[DEBUG] Game ${game.id}: bet found:`, !!bet, 'prediction:', bet?.prediction);
      return {
        ...game,
        userBet: bet && bet.prediction ? bet : null
      };
    });
  }

  res.json({
    week,
    games: gamesWithUserBets,
    canBet: week.status === 'OPEN' && new Date() < week.bettingDeadline
  });
}));

// GET /api/games/:id/stats - Get game betting statistics
router.get('/:id/stats', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const gameId = parseInt(req.params.id);
  
  if (isNaN(gameId)) {
    throw createError('Invalid game ID', 400);
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } }
    }
  });

  if (!game) {
    throw createError('Game not found', 404);
  }

  // Get betting statistics
  const bettingStats = await prisma.bet.groupBy({
    by: ['prediction'],
    where: {
      gameId
    },
    _count: {
      prediction: true
    }
  });

  const totalBets = bettingStats.reduce((sum, stat) => sum + stat._count.prediction, 0);

  const stats = {
    totalBets,
    predictions: {
      home: bettingStats.find(s => s.prediction === 'HOME')?._count.prediction || 0,
      draw: bettingStats.find(s => s.prediction === 'DRAW')?._count.prediction || 0,
      away: bettingStats.find(s => s.prediction === 'AWAY')?._count.prediction || 0
    },
    percentages: {
      home: totalBets > 0 ? ((bettingStats.find(s => s.prediction === 'HOME')?._count.prediction || 0) / totalBets * 100).toFixed(1) : '0.0',
      draw: totalBets > 0 ? ((bettingStats.find(s => s.prediction === 'DRAW')?._count.prediction || 0) / totalBets * 100).toFixed(1) : '0.0',
      away: totalBets > 0 ? ((bettingStats.find(s => s.prediction === 'AWAY')?._count.prediction || 0) / totalBets * 100).toFixed(1) : '0.0'
    }
  };

  res.json({
    game: {
      id: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      matchDate: game.matchDate,
      status: game.status
    },
    stats
  });
}));

export default router;