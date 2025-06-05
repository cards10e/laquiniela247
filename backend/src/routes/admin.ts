import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Validation schemas
const createGameSchema = z.object({
  weekNumber: z.number().int().positive(),
  season: z.string().min(1),
  homeTeamId: z.number().int().positive(),
  awayTeamId: z.number().int().positive(),
  matchDate: z.string().datetime()
});

const updateGameSchema = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED']).optional(),
  matchDate: z.string().datetime().optional()
});

const createWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  season: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  bettingDeadline: z.string().datetime()
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional()
});

// GET /api/admin/dashboard - Admin dashboard overview
router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  // Get overall statistics
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { isActive: true } });
  const totalBets = await prisma.bet.count();
  const totalGames = await prisma.game.count();
  const totalWeeks = await prisma.week.count();

  // Get current week info
  const currentWeek = await prisma.week.findFirst({
    where: {
      status: {
        in: ['OPEN', 'UPCOMING']
      }
    },
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
    }
  });

  // Get recent activity
  const recentBets = await prisma.bet.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      game: {
        include: {
          homeTeam: { select: { name: true, shortName: true } },
          awayTeam: { select: { name: true, shortName: true } }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  // Get user registration stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    }
  });

  res.json({
    overview: {
      totalUsers,
      activeUsers,
      totalBets,
      totalGames,
      totalWeeks,
      newUsersLast30Days: newUsers
    },
    currentWeek,
    recentActivity: recentBets
  });
}));

// GET /api/admin/users - Get all users with pagination
router.get('/users', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const search = req.query.search as string;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      profile: true,
      _count: {
        select: {
          bets: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  });

  const total = await prisma.user.count({ where });

  res.json({
    users,
    pagination: {
      limit,
      offset,
      total
    }
  });
}));

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = parseInt(req.params.id);
  const validatedData = updateUserSchema.parse(req.body);

  if (isNaN(userId)) {
    throw createError('Invalid user ID', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validatedData,
    include: {
      profile: true
    }
  });

  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
}));

// GET /api/admin/games - Get all games with pagination
router.get('/games', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const weekNumber = req.query.weekNumber ? parseInt(req.query.weekNumber as string) : undefined;
  const status = req.query.status as string;

  const where: any = {};
  if (weekNumber) where.weekNumber = weekNumber;
  if (status) where.status = status.toUpperCase();

  const games = await prisma.game.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      week: {
        select: {
          weekNumber: true,
          season: true,
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
      matchDate: 'desc'
    },
    take: limit,
    skip: offset
  });

  const total = await prisma.game.count({ where });

  res.json({
    games,
    pagination: {
      limit,
      offset,
      total
    }
  });
}));

// POST /api/admin/games - Create new game
router.post('/games', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const validatedData = createGameSchema.parse(req.body);
  console.log('[DEBUG] Game creation request:', {
    weekNumber: validatedData.weekNumber,
    season: validatedData.season,
    homeTeamId: validatedData.homeTeamId,
    awayTeamId: validatedData.awayTeamId,
    matchDate: validatedData.matchDate
  });

  // Verify teams exist
  const [homeTeam, awayTeam] = await Promise.all([
    prisma.team.findUnique({ where: { id: validatedData.homeTeamId } }),
    prisma.team.findUnique({ where: { id: validatedData.awayTeamId } })
  ]);

  if (!homeTeam || !awayTeam) {
    throw createError('One or both teams not found', 404);
  }

  if (validatedData.homeTeamId === validatedData.awayTeamId) {
    throw createError('Home and away teams cannot be the same', 400);
  }

  // Verify week exists
  console.log('[DEBUG] Attempting week lookup with:', {
    weekNumber: validatedData.weekNumber,
    season: validatedData.season
  });
  
  let week = await prisma.week.findUnique({
    where: { 
      weekNumber_season: { 
        weekNumber: validatedData.weekNumber, 
        season: validatedData.season 
      } 
    }
  });

  console.log('[DEBUG] Week lookup result:', week);

  if (!week) {
    console.log('[DEBUG] Week not found, creating it automatically');
    // Create the week automatically
    const matchDate = new Date(validatedData.matchDate);
    const startDate = new Date(matchDate);
    startDate.setDate(startDate.getDate() - 1); // Start date is 1 day before match
    const endDate = new Date(matchDate);
    endDate.setDate(endDate.getDate() + 1); // End date is 1 day after match
    const bettingDeadline = new Date(matchDate);
    bettingDeadline.setHours(bettingDeadline.getHours() - 2); // Betting deadline is 2 hours before match

    week = await prisma.week.create({
      data: {
        weekNumber: validatedData.weekNumber,
        season: validatedData.season,
        startDate,
        endDate,
        bettingDeadline,
        status: 'UPCOMING'
      }
    });
    console.log('[DEBUG] Created new week:', week);
  }

  const game = await prisma.game.create({
    data: {
      weekNumber: validatedData.weekNumber,
      homeTeamId: validatedData.homeTeamId,
      awayTeamId: validatedData.awayTeamId,
      matchDate: new Date(validatedData.matchDate)
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      week: true
    }
  });

  res.status(201).json({
    message: 'Game created successfully',
    game
  });
}));

// PUT /api/admin/games/:id - Update game
router.put('/games/:id', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const gameId = parseInt(req.params.id);
  const validatedData = updateGameSchema.parse(req.body);

  if (isNaN(gameId)) {
    throw createError('Invalid game ID', 400);
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId }
  });

  if (!game) {
    throw createError('Game not found', 404);
  }

  const updateData: any = {};
  
  if (validatedData.homeScore !== undefined) updateData.homeScore = validatedData.homeScore;
  if (validatedData.awayScore !== undefined) updateData.awayScore = validatedData.awayScore;
  if (validatedData.status !== undefined) updateData.status = validatedData.status;
  if (validatedData.matchDate !== undefined) updateData.matchDate = new Date(validatedData.matchDate);

  // Calculate result if both scores are provided
  if (validatedData.homeScore !== undefined && validatedData.awayScore !== undefined) {
    if (validatedData.homeScore > validatedData.awayScore) {
      updateData.result = 'HOME';
    } else if (validatedData.awayScore > validatedData.homeScore) {
      updateData.result = 'AWAY';
    } else {
      updateData.result = 'DRAW';
    }
  }

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
    include: {
      homeTeam: true,
      awayTeam: true,
      week: true
    }
  });

  // If game is finished and has a result, update bet results
  if (updatedGame.status === 'FINISHED' && updatedGame.result) {
    const bets = await prisma.bet.findMany({ where: { gameId } });
    for (const bet of bets) {
      let isCorrect: boolean | null = null;
      if (updatedGame.result) {
        isCorrect = bet.prediction === updatedGame.result;
      }
      await prisma.bet.update({ where: { id: bet.id }, data: { isCorrect } });
    }

    // Trigger performance calculation for the week
    // This would typically be done in a background job
    // For now, we'll just mark it as needing calculation
  }

  res.json({
    message: 'Game updated successfully',
    game: updatedGame
  });
}));

// DELETE /api/admin/games/:id - Delete a game and its bets
router.delete('/games/:id', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const gameId = parseInt(req.params.id);
  if (isNaN(gameId)) {
    throw createError('Invalid game ID', 400);
  }
  // Delete bets associated with the game first
  await prisma.bet.deleteMany({ where: { gameId } });
  // Delete the game
  await prisma.game.delete({ where: { id: gameId } });
  res.json({ message: 'Game deleted successfully' });
}));

// POST /api/admin/weeks - Create new week
router.post('/weeks', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  console.log('[DEBUG] /api/admin/weeks called with:', req.body);
  const validatedData = createWeekSchema.parse(req.body);

  // Check if week already exists
  const existingWeek = await prisma.week.findUnique({
    where: { 
      weekNumber_season: { 
        weekNumber: validatedData.weekNumber, 
        season: validatedData.season 
      } 
    }
  });

  if (existingWeek) {
    console.log('[DEBUG] Week already exists:', existingWeek);
    throw createError('Week already exists', 409);
  }

  const week = await prisma.week.create({
    data: {
      weekNumber: validatedData.weekNumber,
      season: validatedData.season,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      bettingDeadline: new Date(validatedData.bettingDeadline),
      status: 'UPCOMING'
    }
  });
  console.log('[DEBUG] Created new week:', week);

  res.status(201).json({
    message: 'Week created successfully',
    week
  });
}));

// GET /api/admin/teams - Get all teams
router.get('/teams', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: {
          homeGames: true,
          awayGames: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  res.json({ teams });
}));

export default router;