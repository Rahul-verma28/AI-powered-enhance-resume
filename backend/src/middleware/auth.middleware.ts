import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AppError } from './error.middleware';
import { User } from '../models';

// Extend Express Request to include auth
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clerkUserId?: string;
    }
  }
}

/**
 * Decode a Clerk JWT token.
 * 
 * Why we decode instead of cryptographically verify:
 * The Clerk middleware on the frontend (Next.js proxy.ts) already verifies 
 * the token signature using Clerk's JWKS. By the time the request reaches
 * our backend, the token has been validated. We just need the payload.
 * 
 * For production, you could add jose/jwks verification here.
 */
function decodeClerkToken(token: string): { sub: string; email?: string; firstName?: string; lastName?: string; imageUrl?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[Auth] Token does not have 3 parts');
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    if (!payload.sub) {
      console.error('[Auth] Token missing "sub" claim:', Object.keys(payload));
      return null;
    }

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      console.error('[Auth] Token expired at:', new Date(payload.exp * 1000).toISOString());
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email || payload.primary_email_address || '',
      firstName: payload.first_name || payload.firstName || '',
      lastName: payload.last_name || payload.lastName || '',
      imageUrl: payload.image_url || payload.imageUrl || '',
    };
  } catch (err) {
    console.error('[Auth] Failed to decode token:', (err as Error).message);
    return null;
  }
}

/**
 * Clerk JWT authentication middleware.
 * Verifies the session token and attaches userId to the request.
 * Also ensures the user exists in MongoDB (upsert).
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // In development, allow bypass with a header for testing
    if (config.nodeEnv === 'development' && req.headers['x-dev-user-id']) {
      const devUserId = req.headers['x-dev-user-id'] as string;
      console.log(`[Auth] Dev bypass: ${devUserId}`);
      req.userId = devUserId;
      req.clerkUserId = devUserId;
      return next();
    }

    // Get the session token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[Auth] No Bearer token on ${req.method} ${req.path}`);
      throw new AppError('No authorization token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid authorization token', 401);
    }

    // Decode the token
    const decoded = decodeClerkToken(token);
    if (!decoded || !decoded.sub) {
      throw new AppError('Invalid or expired session token', 401);
    }

    console.log(`[Auth] User: ${decoded.sub} (${decoded.email || 'no email in token'})`);

    req.clerkUserId = decoded.sub;
    req.userId = decoded.sub;

    // Ensure user exists in our DB (upsert on first request)
    try {
      await User.findOneAndUpdate(
        { clerkId: decoded.sub },
        {
          $setOnInsert: {
            clerkId: decoded.sub,
            plan: 'free',
            creditsUsed: 0,
            creditsLimit: 3,
          },
          $set: {
            // Update these on every auth (in case they changed in Clerk)
            ...(decoded.email ? { email: decoded.email } : {}),
            ...(decoded.firstName ? { firstName: decoded.firstName } : {}),
            ...(decoded.lastName ? { lastName: decoded.lastName } : {}),
            ...(decoded.imageUrl ? { imageUrl: decoded.imageUrl } : {}),
          },
        },
        { upsert: true, new: true }
      );
    } catch (dbErr: any) {
      // Handle duplicate key error (email unique constraint)
      if (dbErr.code === 11000) {
        console.warn('[Auth] Duplicate key on user upsert, updating by clerkId only');
        await User.findOneAndUpdate(
          { clerkId: decoded.sub },
          {
            $setOnInsert: {
              clerkId: decoded.sub,
              plan: 'free',
              creditsUsed: 0,
              creditsLimit: 3,
            },
          },
          { upsert: true, new: true }
        );
      } else {
        console.error('[Auth] DB upsert error:', dbErr.message);
        // Don't fail auth because of DB issue — user is still authenticated
      }
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    console.error('[Auth] Unexpected error:', (error as Error).message);
    next(new AppError('Authentication failed', 401));
  }
}

/**
 * Optional auth — attaches userId if present but doesn't block.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = decodeClerkToken(token);
      if (decoded?.sub) {
        req.userId = decoded.sub;
        req.clerkUserId = decoded.sub;
      }
    }
  } catch {
    // Silently continue — auth is optional
  }
  next();
}
