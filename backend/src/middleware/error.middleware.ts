import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';

  // Always log errors with context
  console.error(`❌ [${req.method} ${req.originalUrl}] Error ${statusCode}:`, err.message);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  res.status(statusCode).json(response);
}

// 404 handler
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
