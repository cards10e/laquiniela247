import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const getWeeksSchema = z.object({
  season: z.string().optional(),
  status: z.enum(['upcoming', 'open', 'closed', 'finished']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

// GET /api/weeks - Get weeks with optional filters
router.get('/', optionalAuthMiddleware, asyncHandler(async (req: express.Request, res: express.Response) => {
  const query = getWeeksSchema.parse(req.query);
  
  const limit = query.limit ? parseInt(query.limit) : 20;
  const offset = query.offset ? parseInt(query.offset) : 0;
  
  const where: any = {};
  
  if (query.season) {
    where.season = query.season;
  }
  
  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  const weeks = await prisma.week.findMany({
    where,
    include: {
      _count: {
        select: {
          games: true,
          bets: true
        }
      }
    },
    orderBy: {
      weekNumber: 'desc'
    },
    take: limit,
    skip: offset
  });

  const total = await prisma.week.count({ where });

  res.json({
    weeks,
    pagination: {
      limit,
      offset,
      total
    }
  });
}));

// GET /api/weeks/current - Get current active week
router.get('/current', asyncHandler(async (req: express.Request, res: express.Response) => {
  const now = new Date();
  const currentWeek = await prisma.week.findFirst({
    where: {
      status: 'OPEN',
      bettingDeadline: {
        gt: now
      }
    },
    include: {
      games: {
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
          }
        },
        orderBy: {
          matchDate: 'asc'
        }
      },
      _count: {
        select: {
          bets: true
        }
      }
    },
    orderBy: [
      { startDate: 'desc' },
      { weekNumber: 'desc' }
    ]
  });

  if (!currentWeek) {
    throw createError('No active week found', 404);
  }

  res.json({
    week: currentWeek,
    canBet: currentWeek.status === 'OPEN' && new Date() < currentWeek.bettingDeadline
  });
}));

// GET /api/weeks/:weekNumber - Get specific week
router.get('/:weekNumber', optionalAuthMiddleware, asyncHandler(async (req: express.Request, res: express.Response) => {
  const weekNumber = parseInt(req.params.weekNumber);
  
  if (isNaN(weekNumber)) {
    throw createError('Invalid week number', 400);
  }

  const week = await prisma.week.findUnique({
    where: { weekNumber },
    include: {
      games: {
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
          }
        },
        orderBy: {
          matchDate: 'asc'
        }
      },
      _count: {
        select: {
          bets: true,
          userPerformance: true
        }
      }
    }
  });

  if (!week) {
    throw createError('Week not found', 404);
  }

  res.json({
    week,
    canBet: week.status === 'OPEN' && new Date() < week.bettingDeadline
  });
}));

// GET /api/weeks/:weekNumber/leaderboard - Get week leaderboard
router.get('/:weekNumber/leaderboard', asyncHandler(async (req: express.Request, res: express.Response) => {
  const weekNumber = parseInt(req.params.weekNumber);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  
  if (isNaN(weekNumber)) {
    throw createError('Invalid week number', 400);
  }

  const week = await prisma.week.findUnique({
    where: { weekNumber }
  });

  if (!week) {
    throw createError('Week not found', 404);
  }

  const leaderboard = await prisma.userPerformance.findMany({
    where: {
      weekId: week.id,
      status: 'CALCULATED'
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: [
      { percentage: 'desc' },
      { totalPredictions: 'desc' },
      { user: { createdAt: 'asc' } }
    ],
    take: limit
  });

  // Add position numbers
  const leaderboardWithPositions = leaderboard.map((entry, index) => ({
    ...entry,
    position: index + 1
  }));

  res.json({
    week: {
      weekNumber: week.weekNumber,
      season: week.season,
      status: week.status
    },
    leaderboard: leaderboardWithPositions,
    totalParticipants: leaderboard.length
  });
}));

// GET /api/weeks/:weekNumber/stats - Get week statistics
router.get('/:weekNumber/stats', asyncHandler(async (req: express.Request, res: express.Response) => {
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

  // Get basic stats
  const totalParticipants = await prisma.userPerformance.count({
    where: { weekId: week.id }
  });

  const totalBets = await prisma.bet.count({
    where: { weekId: week.id }
  });

  const totalGames = await prisma.game.count({
    where: { weekNumber }
  });

  // Get performance distribution
  const performanceStats = await prisma.userPerformance.aggregate({
    where: { weekId: week.id },
    _avg: {
      percentage: true,
      correctPredictions: true
    },
    _max: {
      percentage: true,
      correctPredictions: true
    },
    _min: {
      percentage: true,
      correctPredictions: true
    }
  });

  // Get prediction distribution by game
  const games = await prisma.game.findMany({
    where: { weekNumber },
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
      _count: {
        select: { bets: true }
      }
    }
  });

  const gameStats = await Promise.all(
    games.map(async (game) => {
      const predictions = await prisma.bet.groupBy({
        by: ['prediction'],
        where: { gameId: game.id },
        _count: { prediction: true }
      });

      const totalGameBets = predictions.reduce((sum, p) => sum + p._count.prediction, 0);

      return {
        gameId: game.id,
        homeTeam: game.homeTeam.shortName,
        awayTeam: game.awayTeam.shortName,
        matchDate: game.matchDate,
        status: game.status,
        result: game.result,
        totalBets: totalGameBets,
        predictions: {
          home: predictions.find(p => p.prediction === 'HOME')?._count.prediction || 0,
          draw: predictions.find(p => p.prediction === 'DRAW')?._count.prediction || 0,
          away: predictions.find(p => p.prediction === 'AWAY')?._count.prediction || 0
        }
      };
    })
  );

  res.json({
    week: {
      weekNumber: week.weekNumber,
      season: week.season,
      status: week.status,
      startDate: week.startDate,
      endDate: week.endDate,
      bettingDeadline: week.bettingDeadline
    },
    overview: {
      totalParticipants,
      totalBets,
      totalGames,
      averagePercentage: performanceStats._avg.percentage || 0,
      highestPercentage: performanceStats._max.percentage || 0,
      lowestPercentage: performanceStats._min.percentage || 0
    },
    gameStats
  });
}));

export default router;