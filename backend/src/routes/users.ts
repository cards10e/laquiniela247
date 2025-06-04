import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  preferredLanguage: z.enum(['es', 'en']).optional(),
  emailNotifications: z.boolean().optional(),
  favoriteTeamId: z.number().int().positive().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

// GET /api/users/profile - Get current user's profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          favoriteTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      profile: user.profile ? {
        ...user.profile,
        totalBets: Number(user.profile.totalBets),
        totalCorrect: Number(user.profile.totalCorrect),
        overallPercentage: Number(user.profile.overallPercentage),
        totalWinnings: Number(user.profile.totalWinnings),
        bestWeekPercentage: Number(user.profile.bestWeekPercentage),
        bestRankingPosition: Number(user.profile.bestRankingPosition)
      } : null
    }
  });
}));

// PUT /api/users/profile - Update current user's profile
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;
  const validatedData = updateProfileSchema.parse(req.body);

  // Update user basic info
  const userUpdateData: any = {};
  if (validatedData.firstName !== undefined) userUpdateData.firstName = validatedData.firstName;
  if (validatedData.lastName !== undefined) userUpdateData.lastName = validatedData.lastName;

  // Update profile data
  const profileUpdateData: any = {};
  if (validatedData.preferredLanguage !== undefined) profileUpdateData.preferredLanguage = validatedData.preferredLanguage;
  if (validatedData.emailNotifications !== undefined) profileUpdateData.emailNotifications = validatedData.emailNotifications;
  if (validatedData.favoriteTeamId !== undefined) profileUpdateData.favoriteTeamId = validatedData.favoriteTeamId;

  const result = await prisma.$transaction(async (tx) => {
    // Update user if there's user data to update
    let updatedUser = null;
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await tx.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    // Update profile if there's profile data to update
    let updatedProfile = null;
    if (Object.keys(profileUpdateData).length > 0) {
      updatedProfile = await tx.userProfile.update({
        where: { userId },
        data: profileUpdateData,
        include: {
          favoriteTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true
            }
          }
        }
      });
    }

    return { updatedUser, updatedProfile };
  });

  // Get complete updated user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          favoriteTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true
            }
          }
        }
      }
    }
  });

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user!.id,
      email: user!.email,
      firstName: user!.firstName,
      lastName: user!.lastName,
      role: user!.role,
      profile: user!.profile
    }
  });
}));

// POST /api/users/change-password - Change user's password
router.post('/change-password', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;
  const validatedData = changePasswordSchema.parse(req.body);

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
  
  if (!isValidPassword) {
    throw createError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const newPasswordHash = await bcrypt.hash(validatedData.newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });

  res.json({
    message: 'Password changed successfully'
  });
}));

// GET /api/users/stats - Get user's detailed statistics
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  // Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId }
  });

  if (!profile) {
    throw createError('User profile not found', 404);
  }

  // Get performance history
  const performanceHistory = await prisma.userPerformance.findMany({
    where: { userId },
    include: {
      week: {
        select: {
          weekNumber: true,
          season: true,
          status: true
        }
      }
    },
    orderBy: {
      week: {
        weekNumber: 'desc'
      }
    },
    take: 10
  });

  // Get recent bets
  const recentBets = await prisma.bet.findMany({
    where: { userId },
    include: {
      game: {
        include: {
          homeTeam: { select: { name: true, shortName: true } },
          awayTeam: { select: { name: true, shortName: true } }
        }
      },
      week: {
        select: {
          weekNumber: true,
          season: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  // Calculate additional stats
  const totalWeeksParticipated = performanceHistory.length;
  const averageWeeklyPercentage = totalWeeksParticipated > 0 
    ? performanceHistory.reduce((sum, perf) => sum + Number(perf.percentage), 0) / totalWeeksParticipated
    : 0;

  // Get ranking information (current position among all users)
  const currentRanking = await prisma.userProfile.count({
    where: {
      overallPercentage: {
        gt: profile.overallPercentage
      }
    }
  });

  res.json({
    profile: {
      totalBets: profile.totalBets,
      totalCorrect: profile.totalCorrect,
      overallPercentage: profile.overallPercentage,
      totalWinnings: profile.totalWinnings,
      bestWeekPercentage: profile.bestWeekPercentage,
      bestRankingPosition: profile.bestRankingPosition
    },
    rankings: {
      currentPosition: currentRanking + 1,
      bestPosition: profile.bestRankingPosition
    },
    performance: {
      totalWeeksParticipated,
      averageWeeklyPercentage: Math.round(averageWeeklyPercentage * 100) / 100,
      performanceHistory
    },
    recentActivity: {
      recentBets
    }
  });
}));

// GET /api/users/dashboard - Get dashboard data
router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  // Get current week
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

  // Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      favoriteTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true
        }
      }
    }
  });

  // Get current week bets
  let currentWeekBets: any[] = [];
  let currentWeekPerformance = null;
  if (currentWeek) {
    currentWeekBets = await prisma.bet.findMany({
      where: {
        userId,
        weekId: currentWeek.id
      },
      include: {
        game: {
          include: {
            homeTeam: { select: { name: true, shortName: true, logoUrl: true } },
            awayTeam: { select: { name: true, shortName: true, logoUrl: true } }
          }
        }
      },
      orderBy: {
        game: {
          matchDate: 'asc'
        }
      }
    });

    currentWeekPerformance = await prisma.userPerformance.findUnique({
      where: {
        userId_weekId: {
          userId,
          weekId: currentWeek.id
        }
      }
    });
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

  res.json({
    user: {
      profile
    },
    currentWeek: {
      week: currentWeek,
      bets: currentWeekBets,
      performance: currentWeekPerformance,
      canBet: currentWeek?.status === 'OPEN' && currentWeek && new Date() < currentWeek.bettingDeadline
    },
    recentPerformance,
    quickStats: {
      totalBets: profile?.totalBets || 0,
      totalCorrect: profile?.totalCorrect || 0,
      overallPercentage: profile?.overallPercentage || 0,
      currentWeekBets: currentWeekBets.length
    }
  });
}));

export default router;