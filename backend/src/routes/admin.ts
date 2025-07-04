import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Schema for updating user
const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN']).optional()
});

// Schema for creating game
const createGameSchema = z.object({
  weekNumber: z.number(),
  season: z.string(),
  homeTeamId: z.number(),
  awayTeamId: z.number(),
  matchDate: z.string()
});

// Schema for updating game
const updateGameSchema = z.object({
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED']).optional(),
  matchDate: z.string().optional()
});

// Schema for creating week
const createWeekSchema = z.object({
  weekNumber: z.number(),
  season: z.string(),
  bettingDeadline: z.string(),
  startDate: z.string(),
  endDate: z.string()
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

// Helper function to compute betting status for games
const computeBettingStatus = (game: any, week: any) => {
  const now = new Date();
  const gameDate = new Date(game.matchDate);
  const daysTillGame = (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  // If week is open AND betting deadline hasn't passed, betting is active
  if (week && week.status === 'OPEN' && week.bettingDeadline && new Date(week.bettingDeadline) > now) {
    return {
      status: 'open',
      autoOpenDate: null,
      canOpenNow: false,
      description: 'Abierta para apuestas'
    };
  }
  
  // If week is open but betting deadline has passed, betting is closed
  if (week && week.status === 'OPEN' && week.bettingDeadline && new Date(week.bettingDeadline) <= now) {
    return {
      status: 'closed',
      autoOpenDate: null,
      canOpenNow: false,
      description: 'Cerrada para apuestas'
    };
  }
  
  // If game is more than 7 days away, it's scheduled for auto-open
  if (daysTillGame > 7) {
    const autoOpenDate = new Date(gameDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before
    return {
      status: 'scheduled',
      autoOpenDate: autoOpenDate.toISOString(),
      canOpenNow: false,
      description: 'Auto-programado'
    };
  }
  
  // If game is within 7 days, ready for manual or auto opening
  if (daysTillGame <= 7 && daysTillGame > 0) {
    return {
      status: 'ready',
      autoOpenDate: null,
      canOpenNow: true,
      description: 'Listo para apuestas'
    };
  }
  
  // Game is in the past
  return {
    status: 'past',
    autoOpenDate: null,
    canOpenNow: false,
    description: 'Finalizado'
  };
};

// GET /api/admin/games - Get all games with pagination and computed betting status
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
          id: true,
          weekNumber: true,
          season: true,
          status: true,
          bettingDeadline: true
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

  // Auto-update game statuses based on time before sending response
  const gamesToUpdate = [];
  for (const game of games) {
    const autoStatus = computeAutoGameStatus(game);
    if (autoStatus !== game.status) {
      gamesToUpdate.push({ id: game.id, newStatus: autoStatus });
    }
  }

  let enhancedGames;

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
    const updatedGames = await prisma.game.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        week: {
          select: {
            id: true,
            weekNumber: true,
            season: true,
            status: true,
            bettingDeadline: true
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

    // Enhance updated games with computed betting status
    enhancedGames = updatedGames.map(game => ({
      ...game,
      bettingStatus: computeBettingStatus(game, game.week)
    }));
  } else {
    // Enhance games with computed betting status (no updates needed)
    enhancedGames = games.map(game => ({
      ...game,
      bettingStatus: computeBettingStatus(game, game.week)
    }));
  }

  const total = await prisma.game.count({ where });

  res.json({
    games: enhancedGames,
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
    matchDate: validatedData.matchDate,
    matchDateType: typeof validatedData.matchDate,
    serverTimezone: process.env.TZ || 'system default',
    nodeVersion: process.version
  });

  // Enhanced validation for the matchDate to handle production timezone issues
  let parsedMatchDate: Date;
  try {
    parsedMatchDate = new Date(validatedData.matchDate);
    
    // Additional validation for timezone-related issues
    if (isNaN(parsedMatchDate.getTime())) {
      console.error('[DEBUG] Invalid matchDate - NaN result:', {
        originalDate: validatedData.matchDate,
        parsedResult: parsedMatchDate,
        dateString: parsedMatchDate.toString()
      });
      throw createError(`Invalid match date format: ${validatedData.matchDate}`);
    }
    
    // Check if the date is reasonable (not too far in past/future)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
    
    if (parsedMatchDate < oneYearAgo || parsedMatchDate > twoYearsFromNow) {
      console.warn('[DEBUG] Date outside reasonable range:', {
        parsedDate: parsedMatchDate,
        now: now,
        oneYearAgo: oneYearAgo,
        twoYearsFromNow: twoYearsFromNow
      });
    }
    
    console.log('[DEBUG] Successfully parsed match date:', {
      original: validatedData.matchDate,
      parsed: parsedMatchDate,
      iso: parsedMatchDate.toISOString(),
      local: parsedMatchDate.toString()
    });
    
  } catch (error) {
    console.error('[DEBUG] Date parsing failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inputDate: validatedData.matchDate,
      inputType: typeof validatedData.matchDate
    });
    throw createError(`Failed to parse match date "${validatedData.matchDate}": ${error instanceof Error ? error.message : 'Invalid date format'}`);
  }

  // Check for duplicate games (same teams in same week)
  const existingGame = await prisma.game.findFirst({
    where: {
      weekNumber: validatedData.weekNumber,
      OR: [
        {
          homeTeamId: validatedData.homeTeamId,
          awayTeamId: validatedData.awayTeamId
        },
        {
          homeTeamId: validatedData.awayTeamId,
          awayTeamId: validatedData.homeTeamId
        }
      ]
    }
  });

  if (existingGame) {
    throw createError('A game with these teams already exists in this week');
  }

  // Find or create the week
  let week = await prisma.week.findFirst({
    where: {
      weekNumber: validatedData.weekNumber,
      season: validatedData.season
    }
  });

  if (!week) {
    console.log('[DEBUG] Creating new week:', validatedData.weekNumber);
    
    // Use the parsed date for week calculations to ensure consistency
    const startDate = new Date(parsedMatchDate);
    startDate.setDate(startDate.getDate() - 1); // Start date is 1 day before match
    const endDate = new Date(parsedMatchDate);
    endDate.setDate(endDate.getDate() + 1); // End date is 1 day after match
    const bettingDeadline = new Date(parsedMatchDate);
    bettingDeadline.setHours(bettingDeadline.getHours() - 2); // Betting deadline is 2 hours before match

    console.log('[DEBUG] Week date calculations:', {
      matchDate: parsedMatchDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bettingDeadline: bettingDeadline.toISOString()
    });

    week = await prisma.week.create({
      data: {
        weekNumber: validatedData.weekNumber,
        season: validatedData.season,
        startDate: startDate,
        endDate: endDate,
        bettingDeadline: bettingDeadline,
        status: 'UPCOMING'
      }
    });
    console.log('[DEBUG] Created week:', week);
  }

  // Create the game using the validated parsed date
  const game = await prisma.game.create({
    data: {
      weekNumber: validatedData.weekNumber,
      homeTeamId: validatedData.homeTeamId,
      awayTeamId: validatedData.awayTeamId,
      matchDate: parsedMatchDate, // Use the validated parsed date
      status: 'SCHEDULED'
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      week: true
    }
  });

  console.log('[DEBUG] Successfully created game:', {
    id: game.id,
    matchDate: game.matchDate,
    homeTeam: game.homeTeam.name,
    awayTeam: game.awayTeam.name
  });

  res.status(201).json(game);
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
  if (validatedData.status !== undefined) updateData.status = validatedData.status;
  if (validatedData.homeScore !== undefined) updateData.homeScore = validatedData.homeScore;
  if (validatedData.awayScore !== undefined) updateData.awayScore = validatedData.awayScore;
  if (validatedData.matchDate !== undefined) updateData.matchDate = new Date(validatedData.matchDate);

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

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

// PUT /api/admin/weeks/:id - Update week status and betting deadline
router.put('/weeks/:id', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const weekId = parseInt(req.params.id);
  if (isNaN(weekId)) {
    throw createError('Invalid week ID', 400);
  }

  const { status, bettingDeadline } = req.body;
  if (!status && !bettingDeadline) {
    throw createError('No update fields provided', 400);
  }

  const updateData: any = {};
  if (status) updateData.status = status.toUpperCase();
  if (bettingDeadline) updateData.bettingDeadline = new Date(bettingDeadline);

  const week = await prisma.week.findUnique({ where: { id: weekId } });
  if (!week) {
    throw createError('Week not found', 404);
  }

  const updatedWeek = await prisma.week.update({
    where: { id: weekId },
    data: updateData,
  });

  res.json({
    message: 'Week updated successfully',
    week: updatedWeek,
  });
}));

// POST /api/admin/games/auto-update-status - Auto-update all game statuses based on time
router.post('/games/auto-update-status', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const now = new Date();
  
  // Get all games that might need status updates
  const games = await prisma.game.findMany({
    where: {
      status: {
        in: ['SCHEDULED', 'LIVE']
      }
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } }
    }
  });

  const statusUpdates = [];
  
  for (const game of games) {
    const autoStatus = computeAutoGameStatus(game);
    if (autoStatus !== game.status) {
      statusUpdates.push({
        gameId: game.id,
        oldStatus: game.status,
        newStatus: autoStatus,
        gameName: `${game.homeTeam.name} vs ${game.awayTeam.name}`,
        matchDate: game.matchDate
      });
      
      // Update the game status
      await prisma.game.update({
        where: { id: game.id },
        data: { status: autoStatus }
      });
    }
  }

  res.json({
    message: `Auto-updated ${statusUpdates.length} game statuses`,
    updates: statusUpdates,
    timestamp: now.toISOString()
  });
}));

// POST /api/admin/weeks/auto-open - Auto-open betting for weeks ready for betting
router.post('/weeks/auto-open', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const now = new Date();
  
  // Find weeks that are upcoming and have games within 7 days
  const weeks = await prisma.week.findMany({
    where: {
      status: 'UPCOMING'
    },
    include: {
      games: {
        orderBy: {
          matchDate: 'asc'
        }
      }
    }
  });

  const weeksToOpen = [];
  
  for (const week of weeks) {
    if (week.games.length === 0) continue;
    
    const earliestGame = week.games[0];
    const gameDate = new Date(earliestGame.matchDate);
    const daysTillGame = (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    // If earliest game is within 7 days, mark week for auto-opening
    if (daysTillGame <= 7 && daysTillGame > 0) {
      // Set betting deadline to 2 hours before earliest game
      const bettingDeadline = new Date(gameDate.getTime() - (2 * 60 * 60 * 1000));
      
      await prisma.week.update({
        where: { id: week.id },
        data: {
          status: 'OPEN',
          bettingDeadline
        }
      });
      
      weeksToOpen.push({
        weekNumber: week.weekNumber,
        season: week.season,
        bettingDeadline,
        gamesCount: week.games.length
      });
    }
  }

  res.json({
    message: `Auto-opened ${weeksToOpen.length} weeks for betting`,
    openedWeeks: weeksToOpen
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

// DELETE /api/admin/demo-user/bets - Delete all bets for demo user (demo purposes only)
router.delete('/demo-user/bets', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  // Security check: Only allow for demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@laquiniela247.mx' }
  });

  if (!demoUser) {
    throw createError('Demo user not found', 404);
  }

  // Delete all bets for demo user
  const deleteResult = await prisma.bet.deleteMany({
    where: { userId: demoUser.id }
  });

  res.json({
    message: `Successfully deleted ${deleteResult.count} bets for demo user`,
    deletedCount: deleteResult.count,
    timestamp: new Date().toISOString()
  });
}));

export default router;