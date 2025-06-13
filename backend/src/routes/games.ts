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
  
  // If game ended more than 150 minutes ago (2.5 hours), it should be completed
  if (minutesSinceGameStart > 150) {
    return 'COMPLETED';
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

    gamesWithUserBets = games.map(game => {
      const bet = betsByGameId[game.id];
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

// GET /api/games/current-week - Get current week games
router.get('/current-week', optionalAuthMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const now = new Date();
  console.log('[DEBUG] /api/games/current-week called at', now.toISOString());
  const currentWeek = await prisma.week.findFirst({
    where: {
      status: 'OPEN',
      bettingDeadline: {
        gt: now
      }
    },
    orderBy: [
      { startDate: 'desc' },
      { weekNumber: 'desc' }
    ]
  });
  if (!currentWeek) {
    console.log('[DEBUG] No active betting week found');
    throw createError('No active betting week found', 404);
  }
  console.log('[DEBUG] Found week:', {
    weekNumber: currentWeek.weekNumber,
    status: currentWeek.status,
    bettingDeadline: currentWeek.bettingDeadline
  });
  const games = await prisma.game.findMany({
    where: {
      weekNumber: currentWeek.weekNumber
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
    
    // Refetch games with updated statuses
    updatedGames = await prisma.game.findMany({
      where: {
        weekNumber: currentWeek.weekNumber
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
  
  // If user is authenticated, include their bets
  let gamesWithUserBets = updatedGames;
  if (req.user) {
    const userBets = await prisma.bet.findMany({
      where: {
        userId: req.user.id,
        weekId: currentWeek.id
      }
    });
    const betsByGameId = userBets.reduce((acc, bet) => {
      acc[bet.gameId] = bet;
      return acc;
    }, {} as Record<number, any>);
    gamesWithUserBets = updatedGames.map(game => {
      const bet = betsByGameId[game.id];
      return {
        ...game,
        userBet: bet && bet.prediction ? bet : null
      };
    });
  }
  res.json({
    week: currentWeek,
    games: gamesWithUserBets,
    canBet: currentWeek.status === 'OPEN' && new Date() < currentWeek.bettingDeadline
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

    gamesWithUserBets = games.map(game => {
      const bet = betsByGameId[game.id];
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