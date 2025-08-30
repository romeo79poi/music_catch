import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

// JWT secret from environment or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// JWT token generation
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000)
    }, 
    JWT_SECRET, 
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'music-catch-api',
      audience: 'music-catch-app'
    }
  );
};

// JWT token verification
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'music-catch-api',
      audience: 'music-catch-app'
    }) as any;
    
    return { userId: decoded.userId };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Middleware to authenticate JWT token
export const authenticateJWT: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }

    // Add userId to request object for use in route handlers
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(403).json({ 
      success: false,
      message: 'Token authentication failed' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthJWT: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        (req as any).userId = decoded.userId;
      }
    }
    
    // Continue regardless of token presence/validity
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Refresh token generation (longer expiry)
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { 
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    }, 
    JWT_SECRET, 
    { 
      expiresIn: '30d',
      issuer: 'music-catch-api',
      audience: 'music-catch-app'
    }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'music-catch-api',
      audience: 'music-catch-app'
    }) as any;
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
};
