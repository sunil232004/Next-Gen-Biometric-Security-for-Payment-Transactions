import { Request, Response, NextFunction } from 'express';
import { SessionModel } from '../models/session.model.js';
import { UserModel } from '../models/user.model.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      authSession?: any;
    }
  }
}

// Authentication middleware - requires valid token
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Find session
    const session = await SessionModel.findByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Find user
    const user = await UserModel.findById(session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user and session to request
    req.user = user;
    req.authSession = session;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

// Optional authentication - attaches user if token present but doesn't require it
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      const session = await SessionModel.findByToken(token);
      if (session) {
        const user = await UserModel.findById(session.userId);
        if (user) {
          req.user = user;
          req.authSession = session;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail if optional auth has issues
    console.error('[Auth Middleware] Optional auth error:', error);
    next();
  }
}

// Rate limiting helper (simple in-memory)
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    record.count++;
    next();
  };
}

// Cleanup expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Every minute
