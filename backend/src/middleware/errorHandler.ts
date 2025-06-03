import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different types of errors
  if (error instanceof ZodError) {
    // Validation errors
    statusCode = 400;
    message = 'Validation Error';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Database errors
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Duplicate entry. Resource already exists.';
        details = {
          field: error.meta?.target,
          code: error.code
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found.';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed.';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred.';
        details = {
          code: error.code
        };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided.';
  } else if ('statusCode' in error && error.statusCode) {
    // Custom API errors
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong. Please try again later.';
    details = undefined;
  }

  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500) => {
  return new ApiError(message, statusCode);
};