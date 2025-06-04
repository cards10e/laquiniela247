import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const placeBetSchema = z.object({
  gameId: z.number().int().positive(),
  prediction: z.enum(['HOME', 'DRAW', 'AWAY'])
});

const getBetsSchema = z.object({
  weekId: z.string().optional(),
  status: z.enum(['pending', 'won', 'lost']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

// Validation schema for multi-bet (parlay)
const multiBetSchema = z.object({
  weekNumber: z.number().int().positive(),
  bets: z.array(z.object({
    gameId: z.number().int().positive(),
    prediction: z.enum(['HOME', 'DRAW', 'AWAY'])
  })),
  amount: z.number().min(10).max(1000)
});

// POST /api/bets - Place a bet
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const validatedData = placeBetSchema.parse(req.body);
  const userId = req.user!.id;
  // Optionally accept amount from frontend, fallback to 50
  const amount = typeof req.body.amount === 'number' ? req.body.amount : 50;

  // Get game with week information
  const game = await prisma.game.findUnique({
    where: { id: validatedData.gameId },
    include: { week: true }
  });

  if (!game) {
    throw createError('Game not found', 404);
  }

  // Check if betting is still allowed
  if (game.week.status !== 'OPEN') {
    throw createError('Betting is not open for this week', 400);
  }

  if (new Date() > game.week.bettingDeadline) {
    throw createError('Betting deadline has passed', 400);
  }

  if (game.status !== 'SCHEDULED') {
    throw createError('Cannot bet on games that have already started', 400);
  }

  // Check if user already has a bet for this game
  const existingBet = await prisma.bet.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId: validatedData.gameId
      }
    }
  });

  if (existingBet) {
    // Update existing bet (no transaction)
    const updatedBet = await prisma.bet.update({
      where: { id: existingBet.id },
      data: {
        prediction: validatedData.prediction,
        updatedAt: new Date()
      },
      include: {
        game: {
          include: {
            homeTeam: { select: { name: true, shortName: true } },
            awayTeam: { select: { name: true, shortName: true } }
          }
        }
      }
    });

    res.json({
      message: 'Bet updated successfully',
      bet: updatedBet
    });
  } else {
    // Create new bet and transaction
    const result = await prisma.$transaction(async (tx) => {
      const newBet = await tx.bet.create({
        data: {
          userId,
          weekId: game.week.id,
          gameId: validatedData.gameId,
          prediction: validatedData.prediction
        },
        include: {
          game: {
            include: {
              homeTeam: { select: { name: true, shortName: true } },
              awayTeam: { select: { name: true, shortName: true } }
            }
          }
        }
      });
      const transaction = await tx.transaction.create({
        data: {
          userId,
          weekId: game.week.id,
          type: 'ENTRY_FEE',
          amount,
          status: 'COMPLETED'
        }
      });
      return { newBet, transaction };
    });

    res.status(201).json({
      message: 'Bet placed successfully',
      bet: result.newBet,
      transaction: result.transaction
    });
  }
}));

// GET /api/bets - Get user's bets
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const query = getBetsSchema.parse(req.query);
  const userId = req.user!.id;
  
  const limit = query.limit ? parseInt(query.limit) : 20;
  const offset = query.offset ? parseInt(query.offset) : 0;
  
  const where: any = { userId };
  
  if (query.weekId) {
    where.weekId = parseInt(query.weekId);
  }
  
  // Filter by status if provided
  if (query.status) {
    if (query.status === 'pending') {
      where.isCorrect = null;
    } else if (query.status === 'won') {
      where.isCorrect = true;
    } else if (query.status === 'lost') {
      where.isCorrect = false;
    }
  }

  const bets = await prisma.bet.findMany({
    where,
    include: {
      game: {
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } }
        }
      },
      week: {
        select: {
          id: true,
          weekNumber: true,
          season: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  });

  const total = await prisma.bet.count({ where });

  res.json({
    bets,
    pagination: {
      limit,
      offset,
      total
    }
  });
}));

// GET /api/bets/week/:weekNumber - Get user's bets for specific week
router.get('/week/:weekNumber', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const weekNumber = parseInt(req.params.weekNumber);
  const userId = req.user!.id;
  
  if (isNaN(weekNumber)) {
    throw createError('Invalid week number', 400);
  }

  const week = await prisma.week.findUnique({
    where: { weekNumber }
  });

  if (!week) {
    throw createError('Week not found', 404);
  }

  const bets = await prisma.bet.findMany({
    where: {
      userId,
      weekId: week.id
    },
    include: {
      game: {
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } }
        }
      }
    },
    orderBy: {
      game: {
        matchDate: 'asc'
      }
    }
  });

  // Get user's performance for this week
  const performance = await prisma.userPerformance.findUnique({
    where: {
      userId_weekId: {
        userId,
        weekId: week.id
      }
    }
  });

  res.json({
    week,
    bets,
    performance,
    summary: {
      totalBets: bets.length,
      correctBets: bets.filter(bet => bet.isCorrect === true).length,
      incorrectBets: bets.filter(bet => bet.isCorrect === false).length,
      pendingBets: bets.filter(bet => bet.isCorrect === null).length
    }
  });
}));

// GET /api/bets/:id - Get specific bet
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const betId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  if (isNaN(betId)) {
    throw createError('Invalid bet ID', 400);
  }

  const bet = await prisma.bet.findFirst({
    where: {
      id: betId,
      userId // Ensure user can only access their own bets
    },
    include: {
      game: {
        include: {
          homeTeam: true,
          awayTeam: true
        }
      },
      week: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!bet) {
    throw createError('Bet not found', 404);
  }

  res.json({ bet });
}));

// DELETE /api/bets/:id - Cancel a bet (only if game hasn't started)
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const betId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  if (isNaN(betId)) {
    throw createError('Invalid bet ID', 400);
  }

  const bet = await prisma.bet.findFirst({
    where: {
      id: betId,
      userId
    },
    include: {
      game: {
        include: {
          week: true
        }
      }
    }
  });

  if (!bet) {
    throw createError('Bet not found', 404);
  }

  // Check if bet can be cancelled
  if (bet.game.status !== 'SCHEDULED') {
    throw createError('Cannot cancel bet for games that have already started', 400);
  }

  if (bet.game.week.status !== 'OPEN') {
    throw createError('Cannot cancel bet when betting is closed', 400);
  }

  if (new Date() > bet.game.week.bettingDeadline) {
    throw createError('Cannot cancel bet after betting deadline', 400);
  }

  await prisma.bet.delete({
    where: { id: betId }
  });

  res.json({
    message: 'Bet cancelled successfully'
  });
}));

// GET /api/bets/stats/summary - Get user's betting statistics summary
router.get('/stats/summary', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  // Get user profile with overall stats
  const profile = await prisma.userProfile.findUnique({
    where: { userId }
  });

  if (!profile) {
    throw createError('User profile not found', 404);
  }

  // Get recent performance (last 5 weeks)
  const recentPerformance = await prisma.userPerformance.findMany({
    where: { userId },
    include: {
      week: {
        select: {
          weekNumber: true,
          season: true
        }
      }
    },
    orderBy: {
      week: {
        weekNumber: 'desc'
      }
    },
    take: 5
  });

  // Get current week stats
  const currentWeek = await prisma.week.findFirst({
    where: {
      status: {
        in: ['OPEN', 'UPCOMING']
      }
    },
    orderBy: {
      weekNumber: 'desc'
    }
  });

  let currentWeekBets = 0;
  if (currentWeek) {
    currentWeekBets = await prisma.bet.count({
      where: {
        userId,
        weekId: currentWeek.id
      }
    });
  }

  res.json({
    overall: {
      totalBets: profile.totalBets,
      totalCorrect: profile.totalCorrect,
      overallPercentage: profile.overallPercentage,
      totalWinnings: profile.totalWinnings,
      bestWeekPercentage: profile.bestWeekPercentage,
      bestRankingPosition: profile.bestRankingPosition
    },
    currentWeek: {
      weekNumber: currentWeek?.weekNumber,
      betsPlaced: currentWeekBets,
      canStillBet: currentWeek?.status === 'OPEN' && currentWeek && new Date() < currentWeek.bettingDeadline
    },
    recentPerformance
  });
}));

// POST /api/bets/multi - Place all bets for a week (parlay)
router.post('/multi', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { weekNumber, bets, amount } = multiBetSchema.parse(req.body);
  const userId = req.user!.id;

  // Get week and all games for the week
  const week = await prisma.week.findUnique({
    where: { weekNumber },
    include: { games: true }
  });
  if (!week) throw createError('Week not found', 404);
  if (week.status !== 'OPEN') throw createError('Betting is not open for this week', 400);
  if (new Date() > week.bettingDeadline) throw createError('Betting deadline has passed', 400);

  // Require all games for the week to be included
  const weekGameIds = week.games.map(g => g.id).sort();
  const betGameIds = bets.map(b => b.gameId).sort();
  if (JSON.stringify(weekGameIds) !== JSON.stringify(betGameIds)) {
    throw createError('All games for the week must be included in the bet', 400);
  }

  // Check if user already placed a parlay for this week (all bets for all games)
  const existingBets = await prisma.bet.findMany({
    where: { userId, weekId: week.id }
  });
  if (existingBets.length === week.games.length) {
    throw createError('You have already placed all bets for this week', 409);
  }

  // Place all bets and create transaction in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create bets
    const createdBets = await Promise.all(bets.map(bet =>
      tx.bet.create({
        data: {
          userId,
          weekId: week.id,
          gameId: bet.gameId,
          prediction: bet.prediction
        }
      })
    ));
    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'ENTRY_FEE',
        amount,
        status: 'COMPLETED', // mock for now
        weekId: week.id
      }
    });
    return { createdBets, transaction };
  });

  res.status(201).json({
    message: 'Parlay placed successfully',
    bets: result.createdBets,
    transaction: result.transaction
  });
}));

export default router;