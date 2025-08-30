import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { isMongoConnected } from "../lib/mongodb";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

// Main authentication middleware
export const authenticateJWT: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader || undefined;

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie || "";
      const cookies: Record<string, string> = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const idx = c.indexOf("=");
          if (idx === -1) return ["", ""];
          const k = c.slice(0, idx).trim();
          const v = decodeURIComponent(c.slice(idx + 1));
          return [k, v];
        }),
      );
      token = cookies["auth_token"];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
        code: "TOKEN_MISSING",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "music-catch-api",
      audience: "music-catch-app",
    }) as any;

    if (!decoded.userId) {
      return res.status(403).json({
        success: false,
        message: "Invalid token format",
        code: "TOKEN_INVALID",
      });
    }

    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
        code: "DB_UNAVAILABLE",
      });
    }

    // Verify user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user is active/verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified",
        code: "ACCOUNT_NOT_VERIFIED",
      });
    }

    // Add user data to request
    req.userId = decoded.userId;
    req.user = user;

    next();
  } catch (error: any) {
    console.error("JWT authentication error:", error);

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Invalid token",
        code: "TOKEN_INVALID",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(403).json({
        success: false,
        message: "Token not active yet",
        code: "TOKEN_NOT_ACTIVE",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "music-catch-api",
      audience: "music-catch-app",
    }) as any;

    if (decoded.userId && isMongoConnected()) {
      const user = await User.findById(decoded.userId);
      if (user && user.is_verified) {
        req.userId = decoded.userId;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Token-only authentication (no DB requirement)
export const authenticateTokenOnly: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader || undefined;

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie || "";
      const cookies: Record<string, string> = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const idx = c.indexOf("=");
          if (idx === -1) return ["", ""];
          const k = c.slice(0, idx).trim();
          const v = decodeURIComponent(c.slice(idx + 1));
          return [k, v];
        }),
      );
      token = cookies["auth_token"];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "music-catch-api",
      audience: "music-catch-app",
    }) as any;

    if (!decoded?.userId) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    const code = error?.name === "TokenExpiredError" ? 401 : 403;
    return res
      .status(code)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// Admin authentication middleware
export const authenticateAdmin: RequestHandler = async (req, res, next) => {
  try {
    // First run regular auth
    await new Promise<void>((resolve, reject) => {
      authenticateJWT(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is admin
    const user = req.user;
    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        code: "ADMIN_REQUIRED",
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Admin authentication failed",
      code: "ADMIN_AUTH_FAILED",
    });
  }
};

// Rate limiting middleware for auth endpoints
const authAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export const rateLimit = (
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
): RequestHandler => {
  return (req, res, next) => {
    const identifier = req.ip || req.socket.remoteAddress || "unknown";
    const now = new Date();

    const attempts = authAttempts.get(identifier);

    if (attempts) {
      const timeDiff = now.getTime() - attempts.lastAttempt.getTime();

      if (timeDiff < windowMs) {
        if (attempts.count >= maxAttempts) {
          return res.status(429).json({
            success: false,
            message: "Too many attempts. Please try again later.",
            code: "RATE_LIMITED",
            retryAfter: Math.ceil((windowMs - timeDiff) / 1000),
          });
        }
        attempts.count += 1;
        attempts.lastAttempt = now;
      } else {
        // Reset count if window has passed
        attempts.count = 1;
        attempts.lastAttempt = now;
      }
    } else {
      authAttempts.set(identifier, { count: 1, lastAttempt: now });
    }

    next();
  };
};

// Input validation middleware
export const validateRegistrationInput: RequestHandler = (req, res, next) => {
  const { email, username, name, password } = req.body;

  const errors: string[] = [];

  // Email validation
  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  // Username validation
  if (!username) {
    errors.push("Username is required");
  } else if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  } else if (username.length > 20) {
    errors.push("Username must be 20 characters or less");
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  // Name validation
  if (!name) {
    errors.push("Name is required");
  } else if (name.length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Password validation
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

export const validateLoginInput: RequestHandler = (req, res, next) => {
  const { email, username, password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  if (!email && !username) {
    return res.status(400).json({
      success: false,
      message: "Email or username is required",
    });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  next();
};

// Security headers middleware
export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Don't cache auth responses
  if (req.path.includes("/auth")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};
