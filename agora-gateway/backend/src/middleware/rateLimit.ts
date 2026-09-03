import { Request, Response, NextFunction } from 'express';
import redisClient from '../services/redis.js';

const RATE_LIMIT_WINDOW_SECS = 60;
const MAX_REQUESTS = 500;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}`;
    
    // We use a simple Redis INCR and EXPIRE (fixed window)
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW_SECS);
    }
    
    if (current > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    next();
  } catch (e) {
    console.error('[RateLimiter] Error:', e);
    // Fail open if Redis is down
    next();
  }
};
