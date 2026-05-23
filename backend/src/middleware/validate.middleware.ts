import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * Creates validation middleware for request body, query, or params.
 */
export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new AppError(`Validation error: ${message}`, 400));
      } else {
        next(error);
      }
    }
  };
}
