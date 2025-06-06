import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  preferredLanguage: z.enum(['es', 'en']).default('es')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Helper function to generate JWT tokens
const generateTokens = (userId: number) => {
  const secret = process.env.JWT_SECRET!;
  const accessToken = jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

  // Create user and profile in transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: 'USER'
      }
    });

    const profile = await tx.userProfile.create({
      data: {
        userId: user.id,
        preferredLanguage: validatedData.preferredLanguage
      }
    });

    return { user, profile };
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(result.user.id);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = loginSchema.parse(req.body);

  // Find user with profile
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
    include: {
      profile: true
    }
  });

  if (!user || !user.isActive) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
  
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profile: user.profile
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      throw createError('Invalid refresh token', 401);
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      throw createError('User not found or inactive', 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    res.json({
      message: 'Tokens refreshed successfully',
      tokens
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid refresh token', 401);
    }
    throw error;
  }
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (!user) {
    // Don't reveal if email exists or not
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    return;
  }

  // Generate reset token (valid for 1 hour)
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password-reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  // TODO: Send email with reset link
  // For now, just return the token (in production, this should be sent via email)
  
  res.json({
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Remove this in production - only for demo
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
}));

// POST /api/auth/reset-password
router.post('/reset-password', asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = resetPasswordSchema.parse(req.body);

  try {
    const decoded = jwt.verify(validatedData.token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'password-reset') {
      throw createError('Invalid reset token', 401);
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash }
    });

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid or expired reset token', 401);
    }
    throw error;
  }
}));

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  res.json({
    message: 'Logged out successfully'
  });
});

// GET /api/auth/status
router.get('/status', asyncHandler(async (req: express.Request, res: express.Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true
      }
    });

    if (!user || !user.isActive) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
}));

export default router;